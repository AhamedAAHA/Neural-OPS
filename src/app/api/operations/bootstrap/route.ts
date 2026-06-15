import { withAuth, json } from "@/lib/api/handler";
import { ensureLiveOperations } from "@/lib/services/live-bootstrap-service";

export const POST = withAuth("incidents:create", async (_request, { user }) => {
  const result = await ensureLiveOperations(user);
  return json(result);
}, { rateLimitKey: "operations:bootstrap", rateLimitMax: 30 });
