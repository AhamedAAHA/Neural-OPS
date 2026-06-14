import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

interface MemoryQuery {
  vendorName?: string;
  incidentId?: string;
  organizationId?: string;
  limit?: number;
}

export interface MemoryTimelineEvent {
  id: string;
  type: "document" | "incident" | "evidence" | "vendor" | "compliance" | "decision" | "approval" | "report" | "legal";
  title: string;
  detail: string;
  createdAt: string;
}

export interface MemoryAgentResult {
  vendor: {
    name: string | null;
    incidents: number;
    complianceReviews: number;
    legalEscalations: number;
  };
  totals: {
    documents: number;
    incidents: number;
    evidence: number;
    approvals: number;
    reports: number;
  };
  similarIncidents: Array<{
    id: string;
    title: string;
    type: string;
    severity: string;
    status: string;
    createdAt: string;
  }>;
  timeline: MemoryTimelineEvent[];
}

function hasVendorText(value: string | null | undefined, vendorName: string): boolean {
  if (!value) return false;
  return value.toLowerCase().includes(vendorName.toLowerCase());
}

export class MemoryAgent {
  async retrieveSimilarIncidents(query: MemoryQuery) {
    const limit = query.limit ?? 8;

    if (query.incidentId) {
      const base = await prisma.incident.findUnique({ where: { id: query.incidentId } });
      if (!base) return [];

      const orFilters: Prisma.IncidentWhereInput[] = [{ type: base.type }, { severity: base.severity }];
      if (query.vendorName) {
        orFilters.push(
          { title: { contains: query.vendorName, mode: "insensitive" } },
          { description: { contains: query.vendorName, mode: "insensitive" } }
        );
      }

      return prisma.incident.findMany({
        where: {
          id: { not: base.id },
          organizationId: query.organizationId ?? undefined,
          OR: orFilters,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }

    if (query.vendorName) {
      return prisma.incident.findMany({
        where: {
          organizationId: query.organizationId ?? undefined,
          OR: [
            { title: { contains: query.vendorName, mode: "insensitive" } },
            { description: { contains: query.vendorName, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }

    return prisma.incident.findMany({
      where: { organizationId: query.organizationId ?? undefined },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async retrieveVendorHistory(vendorName?: string, organizationId?: string) {
    if (!vendorName) {
      return {
        vendor: null,
        relatedIncidentIds: [] as string[],
        incidents: 0,
        complianceReviews: 0,
        legalEscalations: 0,
      };
    }

    const vendor = await prisma.vendor.findFirst({
      where: {
        organizationId: organizationId ?? undefined,
        name: { contains: vendorName, mode: "insensitive" },
      },
      include: {
        intelligence: {
          include: { incident: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const incidentIds = new Set<string>();
    for (const intel of vendor?.intelligence ?? []) {
      if (intel.incidentId) incidentIds.add(intel.incidentId);
    }

    const textMatchedIncidents = await prisma.incident.findMany({
      where: {
        organizationId: organizationId ?? undefined,
        OR: [
          { title: { contains: vendorName, mode: "insensitive" } },
          { description: { contains: vendorName, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    textMatchedIncidents.forEach((inc) => incidentIds.add(inc.id));

    const incidentIdList = Array.from(incidentIds);

    const [complianceFindings, legalFindings] = await Promise.all([
      incidentIdList.length
        ? prisma.complianceFinding.findMany({ where: { incidentId: { in: incidentIdList } }, select: { incidentId: true } })
        : Promise.resolve([]),
      incidentIdList.length
        ? prisma.legalFinding.findMany({ where: { incidentId: { in: incidentIdList } }, select: { incidentId: true } })
        : Promise.resolve([]),
    ]);

    return {
      vendor,
      relatedIncidentIds: incidentIdList,
      incidents: incidentIdList.length,
      complianceReviews: new Set(complianceFindings.map((row) => row.incidentId)).size,
      legalEscalations: new Set(legalFindings.map((row) => row.incidentId)).size,
    };
  }

  async retrievePastComplianceFindings(incidentIds: string[], limit = 10) {
    if (!incidentIds.length) return [];
    return prisma.complianceFinding.findMany({
      where: { incidentId: { in: incidentIds } },
      include: { incident: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async retrievePastDecisions(incidentIds: string[], limit = 10) {
    const [approvals, humanApprovals, reports] = await Promise.all([
      incidentIds.length
        ? prisma.approval.findMany({
            where: { incidentId: { in: incidentIds } },
            orderBy: { createdAt: "desc" },
            take: limit,
          })
        : Promise.resolve([]),
      incidentIds.length
        ? prisma.humanApproval.findMany({
            where: { incidentId: { in: incidentIds } },
            orderBy: { createdAt: "desc" },
            take: limit,
          })
        : Promise.resolve([]),
      incidentIds.length
        ? prisma.executiveReport.findMany({
            where: { incidentId: { in: incidentIds } },
            orderBy: { createdAt: "desc" },
            take: limit,
          })
        : Promise.resolve([]),
    ]);

    return { approvals, humanApprovals, reports };
  }

  async buildMemory(query: MemoryQuery): Promise<MemoryAgentResult> {
    const limit = query.limit ?? 8;
    const similarIncidents = await this.retrieveSimilarIncidents(query);

    const vendorHistory = await this.retrieveVendorHistory(query.vendorName, query.organizationId);
    const incidentIdSet = new Set<string>(vendorHistory.relatedIncidentIds);
    similarIncidents.forEach((inc) => incidentIdSet.add(inc.id));

    const incidentIds = Array.from(incidentIdSet);

    const vendorName = query.vendorName?.trim() || vendorHistory.vendor?.name || null;

    const [documents, evidence, complianceFindings, decisions, recentVendorIntel] = await Promise.all([
      prisma.document.findMany({
        where: {
          organizationId: query.organizationId ?? undefined,
          ...(incidentIds.length ? { OR: [{ incidentId: { in: incidentIds } }, { incidentId: null }] } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit * 2,
      }),
      incidentIds.length
        ? prisma.evidence.findMany({
            where: { incidentId: { in: incidentIds } },
            include: { incident: { select: { id: true, title: true } } },
            orderBy: { createdAt: "desc" },
            take: limit,
          })
        : Promise.resolve([]),
      this.retrievePastComplianceFindings(incidentIds, limit),
      this.retrievePastDecisions(incidentIds, limit),
      prisma.vendorIntelligence.findMany({
        where: {
          organizationId: query.organizationId ?? undefined,
          ...(vendorName
            ? { vendor: { name: { contains: vendorName, mode: "insensitive" } } }
            : incidentIds.length
              ? { incidentId: { in: incidentIds } }
              : {}),
        },
        include: { vendor: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    const relevantDocuments = vendorName
      ? documents.filter((doc) => hasVendorText(doc.name, vendorName) || hasVendorText(doc.textContent, vendorName))
      : documents;

    const timeline: MemoryTimelineEvent[] = [];

    for (const doc of relevantDocuments.slice(0, limit)) {
      timeline.push({
        id: `doc-${doc.id}`,
        type: "document",
        title: `Document uploaded: ${doc.name}`,
        detail: `${doc.type.toUpperCase()} · ${(doc.sizeBytes / 1024).toFixed(1)}KB`,
        createdAt: doc.createdAt.toISOString(),
      });
    }

    for (const incident of similarIncidents.slice(0, limit)) {
      timeline.push({
        id: `incident-${incident.id}`,
        type: "incident",
        title: incident.title,
        detail: `${incident.type} · ${incident.severity} · ${incident.status}`,
        createdAt: incident.createdAt.toISOString(),
      });
    }

    for (const item of evidence.slice(0, limit)) {
      timeline.push({
        id: `evidence-${item.id}`,
        type: "evidence",
        title: item.title,
        detail: `${item.evidenceType} · Incident ${item.incident?.title ?? item.incidentId}`,
        createdAt: item.createdAt.toISOString(),
      });
    }

    for (const finding of complianceFindings.slice(0, limit)) {
      timeline.push({
        id: `compliance-${finding.id}`,
        type: "compliance",
        title: `Compliance finding: ${finding.regulation}`,
        detail: `${finding.severity} · ${finding.incident.title}`,
        createdAt: finding.createdAt.toISOString(),
      });
    }

    for (const approval of decisions.approvals.slice(0, limit)) {
      timeline.push({
        id: `approval-v2-${approval.id}`,
        type: "approval",
        title: `Approval: ${approval.title}`,
        detail: `${approval.status} · ${approval.riskLevel}`,
        createdAt: approval.createdAt.toISOString(),
      });
    }

    for (const approval of decisions.humanApprovals.slice(0, limit)) {
      timeline.push({
        id: `approval-${approval.id}`,
        type: "decision",
        title: `Human decision: ${approval.actionTitle}`,
        detail: `${approval.status} · ${approval.riskLevel}`,
        createdAt: approval.createdAt.toISOString(),
      });
    }

    for (const report of decisions.reports.slice(0, limit)) {
      timeline.push({
        id: `report-${report.id}`,
        type: "report",
        title: "Executive report generated",
        detail: `Incident ${report.incidentId}`,
        createdAt: report.createdAt.toISOString(),
      });
    }

    if (vendorHistory.vendor) {
      for (const intel of vendorHistory.vendor.intelligence.slice(0, limit)) {
        timeline.push({
          id: `vendor-${intel.id}`,
          type: "vendor",
          title: `Vendor intelligence: ${vendorHistory.vendor.name}`,
          detail: intel.summary ?? `Risk ${intel.riskScore}/100 · ${intel.source}`,
          createdAt: intel.createdAt.toISOString(),
        });
      }
    } else {
      for (const intel of recentVendorIntel) {
        timeline.push({
          id: `vendor-${intel.id}`,
          type: "vendor",
          title: `Vendor intelligence: ${intel.vendor?.name ?? "Vendor"}`,
          detail: intel.summary ?? `Risk ${intel.riskScore}/100 · ${intel.source}`,
          createdAt: intel.createdAt.toISOString(),
        });
      }
    }

    timeline.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    return {
      vendor: {
        name: vendorName,
        incidents: vendorHistory.incidents,
        complianceReviews: vendorHistory.complianceReviews,
        legalEscalations: vendorHistory.legalEscalations,
      },
      totals: {
        documents: relevantDocuments.length,
        incidents: similarIncidents.length,
        evidence: evidence.length,
        approvals: decisions.approvals.length + decisions.humanApprovals.length,
        reports: decisions.reports.length,
      },
      similarIncidents: similarIncidents.map((incident) => ({
        id: incident.id,
        title: incident.title,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        createdAt: incident.createdAt.toISOString(),
      })),
      timeline: timeline.slice(0, limit * 4),
    };
  }
}
