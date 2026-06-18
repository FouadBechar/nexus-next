import { buildProviderMessages } from "./messages";
import { modelSupportsImages } from "./models";
import type { StreamChatOptions } from "./types";

export const DEFAULT_MAX_TOKENS = 2048;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function getOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  return apiKey;
}

export async function streamOpenRouterChat({
  maxTokens,
  messages,
  model,
  systemPrompt,
  temperature,
}: StreamChatOptions) {
  const supportsImages = modelSupportsImages(model);
  const requestMessages = buildProviderMessages({
    messages,
    supportsImages,
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

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenRouterApiKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Nexus Next",
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

    throw new Error(
      error ||
        `OpenRouter request failed with status ${response.status}. Try a shorter response length or another model.`
    );
  }

  if (!response.body) {
    throw new Error("OpenRouter response did not include a stream.");
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function askOpenRouter(message: string) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${getOpenRouterApiKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Nexus Next",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini", 
      max_tokens: DEFAULT_MAX_TOKENS,
      messages: [
        {
          role: "system",
          content: "You are Nexus AI, a helpful assistant.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });

  const data = await res.json();

  return data.choices?.[0]?.message?.content ?? "No response";
}
