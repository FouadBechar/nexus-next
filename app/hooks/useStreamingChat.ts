"use client";

import { useRef, useState } from "react";
import type { Chat } from "../types/chat";
import type { Message } from "../types/message";
import type { ChatSettings } from "../types/settings";

type SendMessageOptions = {
  activeChat: Chat | undefined;
  activeChatId: string;
  text: string;
  settings: ChatSettings;
  onClearInput: () => void;
  updateChatMessages: (id: string, messages: Message[], title?: string) => void;
};

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
    text,
    settings,
    onClearInput,
    updateChatMessages,
  }: SendMessageOptions) {
    if (!text.trim() || !activeChat || loading) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...activeChat.messages, userMessage];
    const nextTitle =
      activeChat.messages.length === 0
        ? text.slice(0, 30).trim() || "New Chat"
        : activeChat.title;

    updateChatMessages(activeChatId, updatedMessages, nextTitle);

    onClearInput();
    setError("");
    setLoading(true);
    setCurrentResponse("");

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
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
