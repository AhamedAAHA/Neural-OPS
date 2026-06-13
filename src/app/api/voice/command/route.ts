import { withAuth, json, parseBody } from "@/lib/api/handler";
import { voiceCommandSchema } from "@/lib/api/schemas";
import { processVoiceTranscript } from "@/lib/services/voice-service";

export const POST = withAuth(
  "voice:use",
  async (request, { user }) => {
    const body = await parseBody(request, voiceCommandSchema);
    const result = await processVoiceTranscript(user, body.transcript, body.incidentId);
    return json(result, 201);
  },
  { rateLimitKey: "voice-command", rateLimitMax: 15 }
);
