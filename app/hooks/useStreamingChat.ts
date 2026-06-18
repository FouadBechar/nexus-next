"use client";

import { useRef, useState } from "react";
import type { Chat } from "../types/chat";
import type { Message, MessageAttachment } from "../types/message";
import type { ChatSettings } from "../types/settings";
import { modelSupportsImages } from "../../lib/ai/models";

type SendMessageOptions = {
  activeChat: Chat | undefined;
  activeChatId: string;
  attachments?: File[];
  baseMessages?: Message[];
  existingUserMessage?: Message;
  text: string;
  settings: ChatSettings;
  onClearInput: () => void;
  updateChatMessages: (id: string, messages: Message[], title?: string) => void;
};

const TEXT_ATTACHMENT_MIME_TYPES = new Set(["text/plain", "text/markdown"]);
const MAX_TEXT_ATTACHMENT_CHARS = 60_000;

class ChatRequestError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ChatRequestError";
  }
}

function isTextAttachment(file: File) {
  const lowerName = file.name.toLowerCase();

  return (
    TEXT_ATTACHMENT_MIME_TYPES.has(file.type) ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".markdown")
  );
}

function getCodeFenceLanguage(file: File) {
  const lowerName = file.name.toLowerCase();

  if (file.type === "text/markdown" || lowerName.endsWith(".md")) {
    return "md";
  }

  return "txt";
}

async function buildTextAttachmentContext(files: File[]) {
  const textFiles = files.filter(isTextAttachment);

  if (textFiles.length === 0) return "";

  const sections = await Promise.all(
    textFiles.map(async (file) => {
      const content = await file.text();
      const truncatedContent =
        content.length > MAX_TEXT_ATTACHMENT_CHARS
          ? `${content.slice(
              0,
              MAX_TEXT_ATTACHMENT_CHARS
            )}\n\n[File truncated after ${MAX_TEXT_ATTACHMENT_CHARS} characters.]`
          : content;

      return [
        `Attached file: ${file.name}`,
        `Type: ${file.type || "text/plain"}`,
        "",
        `\`\`\`${getCodeFenceLanguage(file)}`,
        truncatedContent,
        "```",
      ].join("\n");
    })
  );

  return sections.join("\n\n");
}

function buildExtractedAttachmentContext(attachments: MessageAttachment[]) {
  const sections = attachments
    .filter((attachment) => attachment.extractedText?.trim())
    .map((attachment) =>
      [
        `Attached file: ${attachment.fileName}`,
        `Type: ${attachment.mimeType}`,
        "",
        "```txt",
        attachment.extractedText,
        "```",
      ].join("\n")
    );

  return sections.join("\n\n");
}

function buildUnsupportedAttachmentContext(
  attachments: MessageAttachment[],
  supportsImages: boolean
) {
  const unsupportedImages = supportsImages
    ? []
    : attachments.filter(isImageAttachment);

  if (unsupportedImages.length === 0) return "";

  const imageList = unsupportedImages
    .map((attachment) => `- ${attachment.fileName} (${attachment.mimeType})`)
    .join("\n");

  return [
    "Attachment capability note:",
    "The user uploaded image attachments, but the selected model cannot inspect image content.",
    "If the user asks about what is in the image, explain that this model cannot analyze images and suggest switching to an image-capable model.",
    "",
    imageList,
  ].join("\n");
}

function buildFailedPdfAttachmentContext(attachments: MessageAttachment[]) {
  const failedPdfs = attachments.filter(
    (attachment) =>
      attachment.mimeType === "application/pdf" &&
      attachment.extractionStatus === "failed"
  );

  if (failedPdfs.length === 0) return "";

  const pdfList = failedPdfs
    .map((attachment) =>
      [
        `- ${attachment.fileName}`,
        `  extraction_error: ${attachment.extractionError ?? "parser_failed"}`,
        `  extraction_detail: ${attachment.extractionDetail ?? "unknown_error"}`,
      ].join("\n")
    )
    .join("\n");

  return [
    "Attachment extraction note:",
    "The user uploaded PDF attachments, but server-side text extraction failed.",
    "Do not claim to have read the PDF content. Explain that the uploaded PDF could not be extracted, and ask the user to paste text or try another PDF if they need analysis.",
    "",
    pdfList,
  ].join("\n");
}

function buildUnsupportedImageReply() {
  return [
    "I can't inspect this image with the selected model because it does not support image understanding.",
    "",
    "Please switch to an image-capable model such as GPT-4o Mini, Claude Haiku, or Gemini Flash, then resend the image.",
  ].join("\n");
}

function buildProviderFailureReply(model: string, detail?: string) {
  return [
    `I couldn't get a usable response from ${model}.`,
    ...(detail ? ["", `Reason: ${detail}`] : []),
    "",
    "Please try sending the message again, or switch to another model if this keeps happening.",
  ].join("\n");
}

function isImageAttachment(attachment: MessageAttachment) {
  return attachment.mimeType.startsWith("image/") && Boolean(attachment.url);
}

function withModelReadableAttachments(
  message: Message,
  supportsImages: boolean
): Message {
  const readableAttachments = supportsImages
    ? message.attachments?.filter(isImageAttachment)
    : undefined;

  return {
    ...message,
    attachments:
      readableAttachments && readableAttachments.length > 0
        ? readableAttachments
        : undefined,
  };
}

async function uploadAttachment({
  activeChatId,
  content,
  file,
  messageId,
}: {
  activeChatId: string;
  content: string;
  file: File;
  messageId: string;
}) {
  const formData = new FormData();

  formData.append("chatId", activeChatId);
  formData.append("content", content);
  formData.append("messageId", messageId);
  formData.append("file", file);

  const response = await fetch("/api/attachments", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = (await response.json()) as {
    attachment: MessageAttachment;
  };

  return data.attachment;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong while generating the response.";
}

function getUserFacingRequestError(error: ChatRequestError) {
  if (error.status === 401) {
    return "Please sign in to use chat.";
  }

  if (error.status === 429) {
    return "Too many chat requests. Please wait a moment and try again.";
  }

  if (error.status === 400) {
    return error.message || "The chat request was not valid.";
  }

  if (error.status >= 500) {
    return (
      error.message ||
      "The chat provider failed to respond. Try Response Length: Short or switch models."
    );
  }

  return error.message || "The chat request failed. Please try again.";
}

function getTextFromContentPart(part: unknown): string {
  if (typeof part === "string") return part;

  if (!part || typeof part !== "object") return "";

  const contentPart = part as {
    text?: unknown;
    content?: unknown;
  };

  if (typeof contentPart.text === "string") return contentPart.text;
  if (typeof contentPart.content === "string") return contentPart.content;

  return "";
}

function getTextFromContent(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content.map(getTextFromContentPart).join("");
  }

  return getTextFromContentPart(content);
}

function getStreamToken(json: unknown): string {
  if (!json || typeof json !== "object") return "";

  const data = json as {
    choices?: Array<{
      delta?: {
        content?: unknown;
      };
      message?: {
        content?: unknown;
      };
      text?: unknown;
    }>;
  };
  const choice = data.choices?.[0];

  return (
    getTextFromContent(choice?.delta?.content) ||
    getTextFromContent(choice?.message?.content) ||
    getTextFromContent(choice?.text)
  );
}

function getStreamError(json: unknown): string {
  if (!json || typeof json !== "object") return "";

  const data = json as {
    error?: {
      message?: unknown;
    };
    choices?: Array<{
      error?: {
        message?: unknown;
      };
      finish_reason?: unknown;
    }>;
  };
  const choice = data.choices?.[0];

  if (typeof data.error?.message === "string") return data.error.message;
  if (typeof choice?.error?.message === "string") return choice.error.message;
  if (choice?.finish_reason === "error") return "The provider ended the stream with an error.";

  return "";
}

export function useStreamingChat() {
  const [loading, setLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [error, setError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  async function sendMessage({
    activeChat,
    activeChatId,
    attachments = [],
    baseMessages,
    existingUserMessage,
    text,
    settings,
    onClearInput,
    updateChatMessages,
  }: SendMessageOptions) {
    if ((!text.trim() && attachments.length === 0) || !activeChat || loading) {
      return;
    }

    setError("");
    setLoading(true);
    setCurrentResponse("");

    let savedMessages: Message[] | null = null;
    let savedTitle: string | undefined;

    try {
      const conversationBase = baseMessages ?? activeChat.messages;
      const messageContent =
        (existingUserMessage?.content ?? text.trim()) || "Attached files.";
      const userMessageId = existingUserMessage?.id ?? crypto.randomUUID();
      const uploadedAttachments =
        existingUserMessage?.attachments ??
        (await Promise.all(
          attachments.map((file) =>
            uploadAttachment({
              activeChatId,
              content: messageContent,
              file,
              messageId: userMessageId,
            })
          )
        ));
      const userMessage: Message = existingUserMessage
        ? {
            ...existingUserMessage,
            attachments: uploadedAttachments,
          }
        : {
            id: userMessageId,
            role: "user",
            content: messageContent,
            createdAt: new Date().toISOString(),
            attachments: uploadedAttachments,
          };
      const updatedMessages = [...conversationBase, userMessage];
      const textAttachmentContext = await buildTextAttachmentContext(attachments);
      const extractedAttachmentContext =
        buildExtractedAttachmentContext(uploadedAttachments);
      const selectedModelSupportsImages = modelSupportsImages(settings.model);
      const unsupportedAttachmentContext = buildUnsupportedAttachmentContext(
        uploadedAttachments,
        selectedModelSupportsImages
      );
      const failedPdfAttachmentContext =
        buildFailedPdfAttachmentContext(uploadedAttachments);
      const attachmentContext = [
        textAttachmentContext,
        extractedAttachmentContext,
        unsupportedAttachmentContext,
        failedPdfAttachmentContext,
      ]
        .filter(Boolean)
        .join("\n\n");
      const modelUserMessage = {
        ...userMessage,
        content: attachmentContext
          ? `${messageContent}\n\n${attachmentContext}`
          : messageContent,
      };
      const modelMessages = [...conversationBase, modelUserMessage].map(
        (message) =>
          withModelReadableAttachments(message, selectedModelSupportsImages)
      );
      const nextTitle =
        conversationBase.length === 0
          ? messageContent.slice(0, 30).trim() || "New Chat"
          : activeChat.title;

      updateChatMessages(activeChatId, updatedMessages, nextTitle);
      savedMessages = updatedMessages;
      savedTitle = nextTitle;
      onClearInput();

      if (unsupportedAttachmentContext) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: buildUnsupportedImageReply(),
          createdAt: new Date().toISOString(),
        };

        updateChatMessages(activeChatId, [...updatedMessages, assistantMessage]);
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: modelMessages,
          model: settings.model,
          responseLength: settings.responseLength,
          systemPrompt: settings.systemPrompt,
          temperature: settings.temperature,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ChatRequestError(await response.text(), response.status);
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("The response did not include a stream.");
      }

      const decoder = new TextDecoder();

      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, {
          stream: true,
        });

        const lines = buffer.split("\n");

        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;

          const data = line.replace("data:", "").trim();

          if (data === "[DONE]") continue;

          try {
            const json = JSON.parse(data);
            const streamError = getStreamError(json);

            if (streamError) {
              throw new Error(streamError);
            }

            const token = getStreamToken(json);

            if (token) {
              fullText += token;
              setCurrentResponse(fullText);
            }
          } catch (error) {
            if (error instanceof SyntaxError) continue;
            throw error;
          }
        }
      }

      if (!fullText.trim()) {
        throw new Error(
          "The selected model returned an empty response. Try another model or resend the message."
        );
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullText,
        createdAt: new Date().toISOString(),
      };

      updateChatMessages(activeChatId, [...updatedMessages, assistantMessage]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      console.error(error);
      const requestError =
        error instanceof ChatRequestError
          ? getUserFacingRequestError(error)
          : "";
      const errorMessage = requestError || getErrorMessage(error);
      setError(errorMessage);

      if (requestError) {
        updateChatMessages(activeChatId, activeChat.messages, activeChat.title);
        return;
      }

      if (savedMessages) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: buildProviderFailureReply(settings.model, errorMessage),
          createdAt: new Date().toISOString(),
        };

        updateChatMessages(
          activeChatId,
          [...savedMessages, assistantMessage],
          savedTitle
        );
      }
    } finally {
      abortControllerRef.current = null;
      setCurrentResponse("");
      setLoading(false);
    }
  }

  function stopGeneration() {
    abortControllerRef.current?.abort();

    setLoading(false);
    setCurrentResponse("");
  }

  return {
    currentResponse,
    error,
    loading,
    sendMessage,
    stopGeneration,
  };
}
