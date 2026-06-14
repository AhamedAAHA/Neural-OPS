import { withAuth, json, parseBody } from "@/lib/api/handler";
import { ApiValidationError } from "@/lib/auth/rbac";
import { assertIncidentInOrganization } from "@/lib/auth/tenant";
import {
  executiveIntelligenceGenerateSchema,
  executiveIntelligenceQuerySchema,
} from "@/lib/api/schemas";
import {
  EnterpriseForecastAgent,
  generateBoardIntelligenceReport,
  getLatestBoardIntelligenceReport,
} from "@/lib/services";

export const GET = withAuth("reports:read", async (request, { organizationId }) => {
  const { searchParams } = new URL(request.url);
  const parsed = executiveIntelligenceQuerySchema.safeParse({
    incidentId: searchParams.get("incidentId") ?? undefined,
    includeForecast: searchParams.get("includeForecast") ?? undefined,
  });
  if (!parsed.success) {
    throw new ApiValidationError(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  if (parsed.data.incidentId) {
    await assertIncidentInOrganization(parsed.data.incidentId, organizationId);
  }

  const [latestReport, forecast] = await Promise.all([
    getLatestBoardIntelligenceReport(organizationId, parsed.data.incidentId),
    parsed.data.includeForecast ? new EnterpriseForecastAgent().buildForecast(organizationId, parsed.data.incidentId) : null,
  ]);

  return json({
    report: latestReport,
    forecast,
  });
}, { rateLimitKey: "executive:intelligence:get", rateLimitMax: 120 });

export const POST = withAuth("reports:generate", async (request, { organizationId }) => {
  const body = await parseBody(request, executiveIntelligenceGenerateSchema);

  if (body.incidentId) {
    await assertIncidentInOrganization(body.incidentId, organizationId);
  }

  const payload = await generateBoardIntelligenceReport(organizationId, body.incidentId);

  return json(payload, 201);
}, { rateLimitKey: "executive:intelligence:generate", rateLimitMax: 20 });
