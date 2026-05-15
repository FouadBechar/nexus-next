"use client";

import { useUser } from "@clerk/nextjs";
import { useRef, useState } from "react";
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
import { MODELS } from "../lib/ai/models";
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
    renameChat,
    setActiveChatId,
    updateChatMessages,
  } = useChats(isSignedIn ? user?.id ?? null : null, isLoaded);
  const { resetSettings, settings, updateSettings } = useChatSettings();

  const {
    currentResponse,
    error,
    loading,
    sendMessage,
    stopGeneration,
  } = useStreamingChat();

  useAutoScroll(
    bottomRef,
    `${activeChatId}:${activeChat?.messages.length ?? 0}:${currentResponse}`
  );

  function handleCreateNewChat() {
    createNewChat();
    setSidebarOpen(false);
  }

  function handleSelectChat(id: string) {
    setActiveChatId(id);
    setSidebarOpen(false);
  }

  function handleRenameChat(id: string) {
    const title = prompt("Rename chat");
    if (!title) return;

    renameChat(id, title);
  }

  function handleSendMessage(customText?: string) {
    sendMessage({
      activeChat,
      activeChatId,
      text: customText || input,
      settings,
      onClearInput: () => setInput(""),
      updateChatMessages,
    });
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  function regenerateLast() {
    if (!activeChat) return;

    const lastUserMessage = [...activeChat.messages]
      .reverse()
      .find((message) => message.role === "user");

    if (!lastUserMessage) return;

    handleSendMessage(lastUserMessage.content);
  }

  function exportMarkdown() {
    if (!activeChat || activeChat.messages.length === 0) return;

    exportChatAsMarkdown(activeChat);
  }

  function exportJson() {
    if (!activeChat || activeChat.messages.length === 0) return;

    exportChatAsJson(activeChat);
  }

  return (
    <main className="flex h-screen overflow-hidden bg-black text-white">
      <ChatSidebar
        activeChatId={activeChatId}
        chats={chats}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCreateChat={handleCreateNewChat}
        onDeleteChat={deleteChat}
        onRenameChat={handleRenameChat}
        onSelectChat={handleSelectChat}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <Header
          isSignedIn={isSignedIn}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <ModelSelector
          models={MODELS}
          selectedModel={settings.model}
          onChange={(model) => updateSettings({ model })}
        />

        {activeChat?.messages.length === 0 && <EmptyState />}

        <div className="min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          {activeChat?.messages.map((message, index) => (
            <ChatMessage
              key={`${message.createdAt ?? index}-${message.role}`}
              message={message}
              onCopy={copyText}
            />
          ))}

          <StreamingMessage content={currentResponse} />

          {loading && !currentResponse && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>

        <ChatInput
          canExport={Boolean(activeChat?.messages.length)}
          error={error}
          input={input}
          loading={loading}
          onChange={setInput}
          onExportJson={exportJson}
          onExportMarkdown={exportMarkdown}
          onRegenerate={regenerateLast}
          onSend={() => handleSendMessage()}
          onStop={stopGeneration}
        />
      </section>

      <SettingsPanel
        models={MODELS}
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onReset={resetSettings}
        onUpdate={updateSettings}
      />
    </main>
  );
}
