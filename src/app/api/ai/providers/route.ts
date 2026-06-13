import { withAuth, json } from "@/lib/api/handler";
import { getAvailableProviders } from "@/lib/ai/providers";

export const GET = withAuth(null, async () => {
  return json({ providers: getAvailableProviders() });
});
