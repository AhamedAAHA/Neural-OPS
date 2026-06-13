import { withAuth, json } from "@/lib/api/handler";
import { ApiNotFoundError } from "@/lib/auth/rbac";
import { getReport } from "@/lib/services/report-service";

export const GET = withAuth("reports:read", async (_request, { params }) => {
  const report = await getReport(params.id);
  if (!report) throw new ApiNotFoundError("Report not found");
  return json({ report });
});
