import { modelSupportsImages } from "./models";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

type AttachmentPayload = {
  fileName?: string;
  mimeType: string;
  url: string;
};

type OpenRouterContentPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image_url";
      image_url: {
        url: string;
      };
    };

type OpenRouterMessage = {
  role: "user" | "assistant" | "system";
  content: string | OpenRouterContentPart[];
  attachments?: AttachmentPayload[];
};

type StreamOpenRouterChatOptions = {
  messages: OpenRouterMessage[];
  model: string;
  systemPrompt?: string;
  temperature?: number;
};

function getOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  return apiKey;
}

function isImageAttachment(attachment: AttachmentPayload) {
  return attachment.mimeType.startsWith("image/") && Boolean(attachment.url);
}

function toOpenRouterMessage(
  message: OpenRouterMessage,
  supportsImages: boolean
): OpenRouterMessage {
  if (
    !supportsImages ||
    message.role !== "user" ||
    typeof message.content !== "string"
  ) {
    return {
      role: message.role,
      content: message.content,
    };
  }

  const imageAttachments = message.attachments?.filter(isImageAttachment) ?? [];

  if (imageAttachments.length === 0) {
    return {
      role: message.role,
      content: message.content,
    };
  }

  return {
    role: message.role,
    content: [
      {
        type: "text",
        text: message.content,
      },
      ...imageAttachments.map((attachment) => ({
        type: "image_url" as const,
        image_url: {
          url: attachment.url,
        },
      })),
    ],
  };
}

export async function streamOpenRouterChat({
  messages,
  model,
  systemPrompt,
  temperature,
}: StreamOpenRouterChatOptions) {
  const trimmedSystemPrompt = systemPrompt?.trim();
  const supportsImages = modelSupportsImages(model);
  const requestChatMessages = messages.map((message) =>
    toOpenRouterMessage(message, supportsImages)
  );
  const requestMessages = trimmedSystemPrompt
    ? [
        {
          role: "system" as const,
          content: trimmedSystemPrompt,
        },
        ...requestChatMessages,
      ]
    : requestChatMessages;
  const safeTemperature =
    typeof temperature === "number"
      ? Math.min(2, Math.max(0, temperature))
      : undefined;

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
