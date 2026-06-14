import { withAuth, json } from "@/lib/api/handler";
import { BandService } from "@/lib/band";

export const GET = withAuth("incidents:read", async (request) => {
  const incidentId = new URL(request.url).searchParams.get("incidentId") ?? undefined;
  const bandService = new BandService();
  const room = await bandService.getRoomStatus(incidentId);
  return json({ room });
});
