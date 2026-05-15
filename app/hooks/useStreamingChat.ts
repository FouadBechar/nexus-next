"use client";

import { useRef, useState } from "react";
import type { Chat } from "../types/chat";
import type { Message, MessageAttachment } from "../types/message";
import type { ChatSettings } from "../types/settings";

type SendMessageOptions = {
  activeChat: Chat | undefined;
  activeChatId: string;
  attachments?: File[];
  text: string;
  settings: ChatSettings;
  onClearInput: () => void;
  updateChatMessages: (id: string, messages: Message[], title?: string) => void;
};

const TEXT_ATTACHMENT_MIME_TYPES = new Set(["text/plain", "text/markdown"]);
const MAX_TEXT_ATTACHMENT_CHARS = 60_000;

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

export function useStreamingChat() {
  const [loading, setLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [error, setError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  async function sendMessage({
    activeChat,
    activeChatId,
    attachments = [],
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

    try {
      const userMessageId = crypto.randomUUID();
      const messageContent = text.trim() || "Attached files.";
      const uploadedAttachments = await Promise.all(
        attachments.map((file) =>
          uploadAttachment({
            activeChatId,
            content: messageContent,
            file,
            messageId: userMessageId,
          })
        )
      );
      const userMessage: Message = {
        id: userMessageId,
        role: "user",
        content: messageContent,
        createdAt: new Date().toISOString(),
        attachments: uploadedAttachments,
      };
      const updatedMessages = [...activeChat.messages, userMessage];
      const textAttachmentContext = await buildTextAttachmentContext(attachments);
      const modelMessages = textAttachmentContext
        ? [
            ...activeChat.messages,
            {
              ...userMessage,
              attachments: undefined,
              content: `${messageContent}\n\n${textAttachmentContext}`,
            },
          ]
        : updatedMessages;
      const nextTitle =
        activeChat.messages.length === 0
          ? messageContent.slice(0, 30).trim() || "New Chat"
          : activeChat.title;

      updateChatMessages(activeChatId, updatedMessages, nextTitle);
      onClearInput();

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
          systemPrompt: settings.systemPrompt,
          temperature: settings.temperature,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(await response.text());
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
            const token = json?.choices?.[0]?.delta?.content;

            if (token) {
              fullText += token;
              setCurrentResponse(fullText);
            }
          } catch {}
        }
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
      setError(getErrorMessage(error));
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
