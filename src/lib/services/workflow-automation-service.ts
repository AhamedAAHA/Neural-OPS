import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/auth/session";
import type { Prisma, WorkflowDefinition, WorkflowExecutionStatus, WorkflowTriggerType } from "@prisma/client";
import { startInvestigationWorkflow } from "@/lib/services/workflow-service";
import { BandService } from "@/lib/band";
import { createDbAgent, wrapAgent } from "@/lib/agents/registry";
import { generateExecutiveReport } from "@/lib/services/report-service";
import { recordMonitoringEvent } from "@/lib/observability/store";

export const WORKFLOW_ACTIONS = [
  "CREATE_INVESTIGATION",
  "CREATE_BAND_ROOM",
  "RECRUIT_AGENTS",
  "NOTIFY_LEGAL",
  "NOTIFY_COMPLIANCE",
  "GENERATE_REPORT",
] as const;

type WorkflowAction = (typeof WORKFLOW_ACTIONS)[number];

interface WorkflowInput {
  name: string;
  description?: string;
  triggerType: WorkflowTriggerType;
  triggerConfig?: Record<string, unknown>;
  actions: WorkflowAction[];
  graph?: Record<string, unknown>;
  enabled?: boolean;
}

export async function listWorkflows(organizationId: string) {
  return prisma.workflowDefinition.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listWorkflowExecutions(organizationId: string, limit = 100) {
  return prisma.workflowExecution.findMany({
    where: { organizationId },
    include: {
      workflow: { select: { id: true, name: true, triggerType: true, enabled: true } },
    },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function createWorkflow(user: AuthUser, input: WorkflowInput) {
  const workflow = await prisma.workflowDefinition.create({
    data: {
      organizationId: user.organizationId,
      createdById: user.id,
      name: input.name,
      description: input.description,
      triggerType: input.triggerType,
      triggerConfigJson: (input.triggerConfig ?? {}) as Prisma.InputJsonValue,
      actionsJson: input.actions as unknown as Prisma.InputJsonValue,
      graphJson: (input.graph ?? {}) as Prisma.InputJsonValue,
      enabled: input.enabled ?? true,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId,
      actorType: "user",
      actorId: user.id,
      action: "workflow_created",
      detailsJson: {
        workflowId: workflow.id,
        triggerType: workflow.triggerType,
        actions: input.actions,
      },
    },
  });

  return workflow;
}

export async function updateWorkflow(
  organizationId: string,
  workflowId: string,
  input: Partial<WorkflowInput> & { enabled?: boolean }
) {
  const workflow = await prisma.workflowDefinition.update({
    where: { id: workflowId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.triggerType !== undefined ? { triggerType: input.triggerType } : {}),
      ...(input.triggerConfig !== undefined ? { triggerConfigJson: input.triggerConfig as Prisma.InputJsonValue } : {}),
      ...(input.actions !== undefined ? { actionsJson: input.actions as unknown as Prisma.InputJsonValue } : {}),
      ...(input.graph !== undefined ? { graphJson: input.graph as Prisma.InputJsonValue } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      organizationId,
    },
  });

  return workflow;
}

export async function deleteWorkflow(workflowId: string) {
  await prisma.workflowDefinition.delete({ where: { id: workflowId } });
}

interface TriggerInput {
  organizationId: string;
  triggerType: WorkflowTriggerType;
  payload: Record<string, unknown>;
  incidentId?: string;
}

function parseActions(workflow: WorkflowDefinition): WorkflowAction[] {
  const raw = workflow.actionsJson;
  if (!Array.isArray(raw)) return [];
  return raw.filter((action): action is WorkflowAction =>
    typeof action === "string" && (WORKFLOW_ACTIONS as readonly string[]).includes(action)
  );
}

function matchesTrigger(workflow: WorkflowDefinition, payload: Record<string, unknown>) {
  if (workflow.triggerType === "VENDOR_RISK_THRESHOLD") {
    const threshold = Number((workflow.triggerConfigJson as Record<string, unknown>)?.threshold ?? 70);
    const score = Number(payload.vendorRiskScore ?? 0);
    return score >= threshold;
  }
  if (workflow.triggerType === "COMPLIANCE_VIOLATION") {
    const threshold = String((workflow.triggerConfigJson as Record<string, unknown>)?.minimumSeverity ?? "high").toLowerCase();
    const severity = String(payload.severity ?? "medium").toLowerCase();
    const order = ["low", "medium", "high", "critical"];
    return order.indexOf(severity) >= order.indexOf(threshold);
  }
  return true;
}

async function ensureInvestigationRoom(incidentId: string, organizationId: string) {
  const incident = await prisma.incident.findUnique({ where: { id: incidentId }, include: { rooms: true } });
  if (!incident) throw new Error("Incident not found");
  if (incident.rooms[0]) return incident.rooms[0];

  const bandService = new BandService();
  const bandRoomId = await bandService.createRoom(
    `Workflow Investigation: ${incident.title}`,
    { incidentId: incident.id, source: "workflow" },
    { incidentId: incident.id, organizationId }
  );

  return prisma.investigationRoom.create({
    data: {
      incidentId: incident.id,
      bandRoomId,
      name: `ROOM-${incident.id.slice(-6).toUpperCase()}`,
      status: "active",
    },
  });
}

async function runAction(params: {
  action: WorkflowAction;
  incidentId?: string;
  organizationId: string;
  payload: Record<string, unknown>;
}) {
  const { action, incidentId, organizationId } = params;

  if (action === "CREATE_INVESTIGATION") {
    if (!incidentId) throw new Error("CREATE_INVESTIGATION requires incidentId");
    await startInvestigationWorkflow(incidentId);
    return { action, status: "completed", detail: "Investigation workflow started" };
  }

  if (action === "CREATE_BAND_ROOM") {
    if (!incidentId) throw new Error("CREATE_BAND_ROOM requires incidentId");
    const room = await ensureInvestigationRoom(incidentId, organizationId);
    return { action, status: "completed", detail: `Band room ${room.bandRoomId} ready` };
  }

  if (action === "RECRUIT_AGENTS") {
    if (!incidentId) throw new Error("RECRUIT_AGENTS requires incidentId");
    const room = await ensureInvestigationRoom(incidentId, organizationId);
    const roles = Array.isArray(params.payload.agentRoles)
      ? (params.payload.agentRoles as string[])
      : ["LegalAgent", "ComplianceAgent", "ExecutiveStrategyAgent"];

    const recruited: string[] = [];
    for (const role of roles) {
      const existing = await prisma.agent.findFirst({ where: { role, roomId: room.id } });
      if (existing) {
        recruited.push(existing.id);
        continue;
      }
      const agent = await createDbAgent(role, room.id);
      recruited.push(agent.id);
    }
    return { action, status: "completed", detail: `Recruited ${recruited.length} agents`, recruited };
  }

  if (action === "NOTIFY_LEGAL" || action === "NOTIFY_COMPLIANCE") {
    if (!incidentId) throw new Error(`${action} requires incidentId`);
    const room = await ensureInvestigationRoom(incidentId, organizationId);
    const commander =
      (await prisma.agent.findFirst({ where: { roomId: room.id, role: "IncidentCommanderAgent" } })) ??
      (await createDbAgent("IncidentCommanderAgent", room.id));

    const targetRole = action === "NOTIFY_LEGAL" ? "LegalAgent" : "ComplianceAgent";
    const recipient = await prisma.agent.findFirst({ where: { roomId: room.id, role: targetRole } });
    if (recipient) {
      const wrapped = await wrapAgent(commander, incidentId, room.id, room.bandRoomId);
      await wrapped.sendMessageToBand(
        recipient.id,
        "REVIEW_REQUEST",
        `Workflow notification for ${targetRole}`,
        {
          workflowTriggered: true,
          triggerPayload: params.payload,
        }
      );
    }

    await prisma.auditLog.create({
      data: {
        organizationId,
        incidentId,
        actorType: "system",
        actorId: "workflow-engine",
        action: action === "NOTIFY_LEGAL" ? "workflow_notified_legal" : "workflow_notified_compliance",
        detailsJson: {
          targetRole,
          delivered: Boolean(recipient),
        },
      },
    });

    return { action, status: "completed", detail: `${targetRole} notified`, delivered: Boolean(recipient) };
  }

  if (action === "GENERATE_REPORT") {
    if (!incidentId) throw new Error("GENERATE_REPORT requires incidentId");
    const report = await generateExecutiveReport(incidentId);
    return { action, status: "completed", detail: "Executive report generated", reportId: report.id };
  }

  return { action, status: "skipped", detail: "Unsupported action" };
}

export async function executeWorkflowsForTrigger(input: TriggerInput) {
  const workflows = await prisma.workflowDefinition.findMany({
    where: {
      organizationId: input.organizationId,
      enabled: true,
      triggerType: input.triggerType,
    },
  });

  const results: Array<{ workflowId: string; executionId?: string; status: WorkflowExecutionStatus; error?: string }> = [];

  for (const workflow of workflows) {
    if (!matchesTrigger(workflow, input.payload)) continue;

    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        organizationId: input.organizationId,
        incidentId: input.incidentId,
        status: "running",
        triggerPayloadJson: input.payload as Prisma.InputJsonValue,
      },
    });

    try {
      const actions = parseActions(workflow);
      const actionResults: Array<Record<string, unknown>> = [];
      for (const action of actions) {
        const actionResult = await runAction({
          action,
          incidentId: input.incidentId,
          organizationId: input.organizationId,
          payload: input.payload,
        });
        actionResults.push(actionResult);
      }

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          actionResultsJson: actionResults as Prisma.InputJsonValue,
        },
      });

      void recordMonitoringEvent({
        organizationId: input.organizationId,
        incidentId: input.incidentId,
        source: "SYSTEM",
        operation: "workflow.execute",
        status: "completed",
        details: {
          workflowId: workflow.id,
          triggerType: input.triggerType,
          actions,
        },
      }).catch(() => {});

      results.push({ workflowId: workflow.id, executionId: execution.id, status: "completed" });
    } catch (error) {
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Workflow execution failed",
        },
      });

      void recordMonitoringEvent({
        organizationId: input.organizationId,
        incidentId: input.incidentId,
        source: "SYSTEM",
        level: "error",
        operation: "workflow.execute",
        status: "failed",
        message: error instanceof Error ? error.message : "Workflow execution failed",
        details: {
          workflowId: workflow.id,
          triggerType: input.triggerType,
        },
      }).catch(() => {});

      results.push({
        workflowId: workflow.id,
        executionId: execution.id,
        status: "failed",
        error: error instanceof Error ? error.message : "Workflow execution failed",
      });
    }
  }

  return results;
}
