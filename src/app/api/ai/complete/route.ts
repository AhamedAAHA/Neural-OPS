import { withAuth, json, parseBody } from "@/lib/api/handler";
import { completeWithFallback } from "@/lib/ai/providers";
import { aiCompleteSchema } from "@/lib/api/schemas";
import { prisma } from "@/lib/db";

export const POST = withAuth(
  "ai:use",
  async (request) => {
    const body = await parseBody(request, aiCompleteSchema);
    const result = await completeWithFallback(body.provider ?? "AIML_API", {
      system: body.system,
      prompt: body.prompt,
      temperature: body.temperature,
      responseFormat: body.responseFormat,
    });

    await prisma.modelInvocation.create({
      data: {
        provider: (body.provider ?? "AIML_API") as never,
        model: result.model,
        agentId: body.agentId,
        incidentId: body.incidentId,
        promptTokens: result.promptTokens ?? 0,
        completionTokens: result.completionTokens ?? 0,
        latencyMs: result.latencyMs ?? 0,
      },
    });

    return json({ result });
  },
  { rateLimitKey: "ai-complete", rateLimitMax: 20 }
);
