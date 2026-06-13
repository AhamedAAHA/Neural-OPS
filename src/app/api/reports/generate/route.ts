import { withAuth, json, parseBody } from "@/lib/api/handler";
import { reportGenerateSchema } from "@/lib/api/schemas";
import { generateExecutiveReport } from "@/lib/services/report-service";

export const POST = withAuth("reports:generate", async (request) => {
  const body = await parseBody(request, reportGenerateSchema);
  const report = await generateExecutiveReport(body.incidentId);
  return json({ report }, 201);
});
