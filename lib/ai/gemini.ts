import { buildProviderMessages } from "./messages";
import { DEFAULT_MAX_TOKENS } from "./openrouter";
import type { StreamChatOptions } from "./types";

const GEMINI_OPENAI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return apiKey;
}

export async function streamGeminiChat({
  maxTokens,
  messages,
  model,
  systemPrompt,
  temperature,
}: StreamChatOptions) {
  const requestMessages = buildProviderMessages({
    messages,
    supportsImages: true,
    systemPrompt,
  });
  const safeTemperature =
    typeof temperature === "number"
      ? Math.min(2, Math.max(0, temperature))
      : undefined;
  const safeMaxTokens =
    typeof maxTokens === "number"
      ? Math.min(4096, Math.max(256, Math.floor(maxTokens)))
      : DEFAULT_MAX_TOKENS;

  const response = await fetch(GEMINI_OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getGeminiApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: requestMessages,
      ...(safeTemperature !== undefined ? { temperature: safeTemperature } : {}),
      max_tokens: safeMaxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();

    throw new Error(error || "Gemini request failed.");
  }

  if (!response.body) {
    throw new Error("Gemini response did not include a stream.");
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

