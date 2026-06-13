import { withAuth, json } from "@/lib/api/handler";
import { transcribeAudio } from "@/lib/services/voice-service";

export const POST = withAuth(
  "voice:use",
  async (request) => {
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;
    if (!file) return json({ error: "audio file required" }, 400);

    const result = await transcribeAudio(file);
    return json({ transcription: result });
  },
  { rateLimitKey: "voice-transcribe", rateLimitMax: 10 }
);
