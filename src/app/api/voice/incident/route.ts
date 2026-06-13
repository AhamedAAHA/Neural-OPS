import { withAuth, json } from "@/lib/api/handler";
import { transcribeAudio, processVoiceTranscript } from "@/lib/services/voice-service";

export const POST = withAuth(
  "voice:use",
  async (request, { user }) => {
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;
    if (!file) return json({ error: "audio file required" }, 400);

    const { transcript, confidence: transcriptionConfidence } = await transcribeAudio(file);
    const result = await processVoiceTranscript(user, transcript);
    return json({ transcript, transcriptionConfidence, ...result }, 201);
  },
  { rateLimitKey: "voice-incident", rateLimitMax: 10 }
);
