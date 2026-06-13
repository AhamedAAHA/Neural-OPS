import { withAuth, json, parseBody } from "@/lib/api/handler";
import { broadcastSchema } from "@/lib/api/schemas";
import { broadcastToRoom } from "@/lib/services/agent-service";

export const POST = withAuth("incidents:read", async (request, { params }) => {
  const body = await parseBody(request, broadcastSchema);
  const bandMessageId = await broadcastToRoom(params.id, body.fromAgentId, body.incidentId, body.summary, body.payload);
  return json({ bandMessageId }, 201);
});
