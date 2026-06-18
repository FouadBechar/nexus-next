import type { AiMessage, AttachmentPayload } from "./types";

function isImageAttachment(attachment: AttachmentPayload) {
  return attachment.mimeType.startsWith("image/") && Boolean(attachment.url);
}

export function toProviderMessage(
  message: AiMessage,
  supportsImages: boolean
): AiMessage {
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

export function buildProviderMessages({
  messages,
  supportsImages,
  systemPrompt,
}: {
  messages: AiMessage[];
  supportsImages: boolean;
  systemPrompt?: string;
}) {
  const trimmedSystemPrompt = systemPrompt?.trim();
  const requestChatMessages = messages.map((message) =>
    toProviderMessage(message, supportsImages)
  );

  return trimmedSystemPrompt
    ? [
        {
          role: "system" as const,
          content: trimmedSystemPrompt,
        },
        ...requestChatMessages,
      ]
    : requestChatMessages;
}

