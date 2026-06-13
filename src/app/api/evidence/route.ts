import { withAuth, json, parseBody } from "@/lib/api/handler";
import { evidenceSchema } from "@/lib/api/schemas";
import { saveEvidence } from "@/lib/services/agent-service";

export const POST = withAuth("evidence:create", async (request) => {
  const body = await parseBody(request, evidenceSchema);
  const evidence = await saveEvidence(body);
  return json({ evidence }, 201);
});
