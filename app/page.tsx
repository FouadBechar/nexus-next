"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useRef, useState } from "react";
import { ChatInput } from "./components/chat/ChatInput";
import { ChatMessage } from "./components/chat/ChatMessage";
import { ChatSidebar } from "./components/chat/ChatSidebar";
import { EmptyState } from "./components/chat/EmptyState";
import { ModelSelector } from "./components/chat/ModelSelector";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { StreamingMessage } from "./components/chat/StreamingMessage";
import { TypingIndicator } from "./components/chat/TypingIndicator";
import { Header } from "./components/layout/Header";
import { useAutoScroll } from "./hooks/useAutoScroll";
import { useChatSettings } from "./hooks/useChatSettings";
import { useChats } from "./hooks/useChats";
import { useStreamingChat } from "./hooks/useStreamingChat";
import { useSpeechSynthesis } from "./hooks/useSpeechSynthesis";
import { MODELS, modelSupportsImages } from "../lib/ai/models";
import {
  exportChatAsJson,
  exportChatAsMarkdown,
} from "../lib/utils/export-chat";

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const {
    activeChat,
    activeChatId,
    chats,
    createNewChat,
    deleteChat,
    persistenceError,
    renameChat,
    setActiveChatId,
    updateChatMessages,
  } = useChats(isSignedIn ? user?.id ?? null : null, isLoaded);
  const { resetSettings, settings, updateSettings } = useChatSettings();
  const selectedModelSupportsImages = modelSupportsImages(settings.model);

  const {
    currentResponse,
    error,
    loading,
    sendMessage,
    stopGeneration,
  } = useStreamingChat();
  const {
    isSupported: speechSynthesisSupported,
    speakingMessageId,
    speak,
    stopSpeaking,
  } = useSpeechSynthesis();

  useAutoScroll(
    bottomRef,
    `${activeChatId}:${activeChat?.messages.length ?? 0}:${currentResponse}`
  );

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const openSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const handleCreateNewChat = useCallback(() => {
    createNewChat();
    setSidebarOpen(false);
  }, [createNewChat]);

  const handleSelectChat = useCallback((id: string) => {
    setActiveChatId(id);
    setSidebarOpen(false);
  }, [setActiveChatId]);

  const handleRenameChat = useCallback((id: string) => {
    const title = prompt("Rename chat");
    if (!title) return;

    renameChat(id, title);
  }, [renameChat]);

  const handleSendMessage = useCallback((customText?: string, files?: File[]) => {
    return sendMessage({
      activeChat,
      activeChatId,
      attachments: files,
      text: customText || input,
      settings,
      onClearInput: () => setInput(""),
      updateChatMessages,
    });
  }, [activeChat, activeChatId, input, sendMessage, settings, updateChatMessages]);

  const handleRegenerateMessage = useCallback((userMessageIndex: number) => {
    if (!activeChat) return;

    const userMessage = activeChat.messages[userMessageIndex];

    if (!userMessage || userMessage.role !== "user") return;

    return sendMessage({
      activeChat,
      activeChatId,
      baseMessages: activeChat.messages.slice(0, userMessageIndex),
      existingUserMessage: userMessage,
      text: userMessage.content,
      settings,
      onClearInput: () => undefined,
      updateChatMessages,
    });
  }, [activeChat, activeChatId, sendMessage, settings, updateChatMessages]);

  const copyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleToggleSpeech = useCallback(
    (messageId: string, content: string) => {
      if (speakingMessageId === messageId) {
        stopSpeaking();
        return;
      }

      speak(messageId, content);
    },
    [speak, speakingMessageId, stopSpeaking]
  );

  const regenerateLast = useCallback(() => {
    if (!activeChat) return;

    let lastUserMessageIndex = -1;

    for (let index = activeChat.messages.length - 1; index >= 0; index -= 1) {
      if (activeChat.messages[index].role === "user") {
        lastUserMessageIndex = index;
        break;
      }
    }

    if (lastUserMessageIndex === -1) return;

    handleRegenerateMessage(lastUserMessageIndex);
  }, [activeChat, handleRegenerateMessage]);

  const exportMarkdown = useCallback(() => {
    if (!activeChat || activeChat.messages.length === 0) return;

    exportChatAsMarkdown(activeChat);
  }, [activeChat]);

  const exportJson = useCallback(() => {
    if (!activeChat || activeChat.messages.length === 0) return;

    exportChatAsJson(activeChat);
  }, [activeChat]);

  const handleModelChange = useCallback(
    (model: string) => updateSettings({ model }),
    [updateSettings]
  );

  const handleSendInput = useCallback(
    (files?: File[]) => handleSendMessage(undefined, files),
    [handleSendMessage]
  );

  return (
    <main className="flex h-screen overflow-hidden bg-zinc-950 text-white">
      <ChatSidebar
        activeChatId={activeChatId}
        chats={chats}
        open={sidebarOpen}
        onClose={closeSidebar}
        onCreateChat={handleCreateNewChat}
        onDeleteChat={deleteChat}
        onRenameChat={handleRenameChat}
        onSelectChat={handleSelectChat}
      />

      <section className="flex min-w-0 flex-1 flex-col border-l border-white/5">
        <Header
          isSignedIn={isSignedIn}
          onOpenSidebar={openSidebar}
          onOpenSettings={openSettings}
        />

        <ModelSelector
          models={MODELS}
          selectedModel={settings.model}
          onChange={handleModelChange}
        />

        {activeChat?.messages.length === 0 && <EmptyState />}

        <div className="min-w-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden bg-zinc-950 p-4 sm:space-y-6 sm:p-6">
          {activeChat?.messages.map((message, index) => {
            const messageId =
              message.id ?? `${message.createdAt ?? index}-${message.role}`;

            return (
              <ChatMessage
                key={messageId}
                isSpeaking={speakingMessageId === messageId}
                message={message}
                messageId={messageId}
                modelSupportsImages={selectedModelSupportsImages}
                onCopy={copyText}
                onToggleSpeech={handleToggleSpeech}
                speechSupported={speechSynthesisSupported}
              />
            );
          })}

          <StreamingMessage content={currentResponse} />

          {loading && !currentResponse && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>

        <ChatInput
          attachmentsEnabled={Boolean(isSignedIn)}
          canExport={Boolean(activeChat?.messages.length)}
          error={error || persistenceError}
          input={input}
          loading={loading}
          modelSupportsImages={selectedModelSupportsImages}
          onChange={setInput}
          onExportJson={exportJson}
          onExportMarkdown={exportMarkdown}
          onRegenerate={regenerateLast}
          onSend={handleSendInput}
          onStop={stopGeneration}
        />
      </section>

      <SettingsPanel
        models={MODELS}
        open={settingsOpen}
        settings={settings}
        onClose={closeSettings}
        onReset={resetSettings}
        onUpdate={updateSettings}
      />
    </main>
  );
}
