import { transcribeAudio, classifyVoiceIntent } from "./service";

export { transcribeAudio, classifyVoiceIntent } from "./service";

export class SpeechmaticsService {
  static transcribe = transcribeAudio;
  static classifyIntent = classifyVoiceIntent;
}
