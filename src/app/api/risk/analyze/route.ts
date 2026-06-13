import { withAuth, json, parseBody } from "@/lib/api/handler";
import { riskAnalyzeSchema } from "@/lib/api/schemas";
import { analyzeRisk } from "@/lib/services/risk-service";

export const POST = withAuth("risk:analyze", async (request) => {
  const body = await parseBody(request, riskAnalyzeSchema);
  const assessment = await analyzeRisk(body.incidentId, body.agentId);
  return json({ assessment }, 201);
});
