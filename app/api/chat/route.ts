import { NextRequest } from "next/server";
import { DEFAULT_MODEL_ID } from "../../../lib/ai/models";
import { streamOpenRouterChat } from "../../../lib/ai/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { messages, model, systemPrompt, temperature } = await req.json();

    return streamOpenRouterChat({
      messages,
      model: model || DEFAULT_MODEL_ID,
      systemPrompt,
      temperature,
    });
  } catch (error) {
    console.error(error);

    return new Response(
      error instanceof Error ? error.message : "Internal Server Error",
      {
      status: 500,
      }
    );
  }
}
