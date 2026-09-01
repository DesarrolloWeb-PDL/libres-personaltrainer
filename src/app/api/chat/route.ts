import { auth } from "@/lib/auth";
import { z } from "zod";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import {
  buildCoachSystemPrompt,
  gatherCoachContextData,
} from "@/lib/ai/context-builder";

const FALLBACK_MESSAGES = {
  missingKey:
    "El coach no está disponible en este momento porque falta la configuración de OpenAI. Volvé a intentar más tarde.",
  providerError:
    "Hubo un problema al contactar al servicio de IA. Volvé a intentar en unos segundos.",
  unexpected:
    "Ocurrió un error inesperado. Volvé a intentar o contactá soporte si persiste.",
};

const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

const chatBodySchema = z.object({
  messages: z.array(messageSchema),
});

export const maxDuration = 60;

/**
 * POST /api/chat
 *
 * Streaming Spanish coach endpoint.
 * - Requires authentication.
 * - Caps conversation history to the last 20 messages.
 * - Builds a server-side system prompt grounded in the user's real data.
 * - Streams UIMessage parts back to the client.
 * - Returns a Spanish fallback stream on missing config / provider errors.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { messages } = chatBodySchema.parse(body);

    const recentMessages = messages.slice(-20);

    const context = await gatherCoachContextData(session.user.id);
    const systemPrompt = buildCoachSystemPrompt(context);

    if (!process.env.OPENAI_API_KEY) {
      return createFallbackResponse(
        FALLBACK_MESSAGES.missingKey,
        "Missing OPENAI_API_KEY",
      );
    }

    const result = streamText({
      model: openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
      system: systemPrompt,
      messages: await convertToModelMessages(
        recentMessages as unknown as UIMessage[],
      ),
      maxOutputTokens: 500,
      abortSignal: req.signal,
      onFinish: ({ usage }) => {
        console.log("[coach] usage:", usage);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "El mensaje recibido no es válido."
        : FALLBACK_MESSAGES.unexpected;
    return createFallbackResponse(
      message,
      error instanceof Error ? error.message : String(error),
    );
  }
}

function createFallbackResponse(text: string, errorText: string): Response {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: ({ writer }) => {
        const id = "coach-fallback";
        writer.write({ type: "text-start", id });
        writer.write({ type: "text-delta", id, delta: text });
        writer.write({ type: "text-end", id });
        writer.write({ type: "error", errorText });
      },
    }),
  });
}
