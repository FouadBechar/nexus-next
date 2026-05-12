const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

type OpenRouterMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type StreamOpenRouterChatOptions = {
  messages: OpenRouterMessage[];
  model: string;
};

function getOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  return apiKey;
}

export async function streamOpenRouterChat({
  messages,
  model,
}: StreamOpenRouterChatOptions) {
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
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();

    throw new Error(error || "OpenRouter request failed.");
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
      model: "openai/gpt-4o-mini", // يمكنك تغييره لاحقًا
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
