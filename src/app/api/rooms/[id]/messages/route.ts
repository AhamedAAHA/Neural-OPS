import { withAuth, json } from "@/lib/api/handler";
import { getRoomMessages } from "@/lib/services/agent-service";

export const GET = withAuth("incidents:read", async (_request, { params }) => {
  const messages = await getRoomMessages(params.id);
  return json(messages);
});
