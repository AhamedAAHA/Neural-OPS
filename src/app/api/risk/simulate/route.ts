import { withAuth, json, parseBody } from "@/lib/api/handler";
import { riskSimulateSchema } from "@/lib/api/schemas";
import { simulateRisk } from "@/lib/services/risk-service";

export const POST = withAuth("risk:analyze", async (request) => {
  const body = await parseBody(request, riskSimulateSchema);
  const simulation = await simulateRisk(body.incidentId, body.scenario, body.scenarioDescription);
  return json({ simulation });
});
