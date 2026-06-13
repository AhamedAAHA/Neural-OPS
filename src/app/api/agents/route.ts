import { withAuth, json } from "@/lib/api/handler";
import { listAgents } from "@/lib/services/agent-service";

export const GET = withAuth("incidents:read", async (request) => {
  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId") ?? undefined;
  const agents = await listAgents(roomId);
  return json({ agents });
});
