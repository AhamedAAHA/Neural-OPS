import { withAuth, json, parseBody } from "@/lib/api/handler";
import { handoffSchema } from "@/lib/api/schemas";
import { createHandoff } from "@/lib/services/agent-service";

export const POST = withAuth("incidents:read", async (request) => {
  const body = await parseBody(request, handoffSchema);
  const handoff = await createHandoff(body);
  return json({ handoff }, 201);
});
