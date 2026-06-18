"use client";

import { useMemo, useState } from "react";
import type { Chat } from "../../types/chat";

type ChatSidebarProps = {
  activeChatId: string;
  chats: Chat[];
  open: boolean;
  onClose: () => void;
  onCreateChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string) => void;
  onSelectChat: (id: string) => void;
};

type SearchResult = {
  chat: Chat;
  preview: string;
};

function getSearchPreview(chat: Chat, query: string) {
  const normalizedQuery = query.toLowerCase();
  const matchingMessage = chat.messages.find((message) =>
    message.content.toLowerCase().includes(normalizedQuery)
  );

  if (!matchingMessage) return "";

  const matchIndex = matchingMessage.content.toLowerCase().indexOf(normalizedQuery);
  const start = Math.max(0, matchIndex - 32);
  const end = Math.min(
    matchingMessage.content.length,
    matchIndex + query.length + 64
  );
  const prefix = start > 0 ? "... " : "";
  const suffix = end < matchingMessage.content.length ? " ..." : "";

  return `${prefix}${matchingMessage.content.slice(start, end)}${suffix}`;
}

function getSearchResults(chats: Chat[], query: string): SearchResult[] {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return chats.map((chat) => ({
      chat,
      preview: "",
    }));
  }

  const normalizedQuery = trimmedQuery.toLowerCase();

  return chats
    .filter(
      (chat) =>
        chat.title.toLowerCase().includes(normalizedQuery) ||
        chat.messages.some((message) =>
          message.content.toLowerCase().includes(normalizedQuery)
        )
    )
    .map((chat) => ({
      chat,
      preview: getSearchPreview(chat, trimmedQuery),
    }));
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmedQuery.toLowerCase();
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  let matchIndex = lowerText.indexOf(lowerQuery);

  while (matchIndex !== -1) {
    if (matchIndex > currentIndex) {
      parts.push(text.slice(currentIndex, matchIndex));
    }

    parts.push(
      <mark
        key={`${matchIndex}-${trimmedQuery}`}
        className="rounded bg-yellow-300/20 px-0.5 text-yellow-100"
      >
        {text.slice(matchIndex, matchIndex + trimmedQuery.length)}
      </mark>
    );

    currentIndex = matchIndex + trimmedQuery.length;
    matchIndex = lowerText.indexOf(lowerQuery, currentIndex);
  }

  if (currentIndex < text.length) {
    parts.push(text.slice(currentIndex));
  }

  return <>{parts}</>;
}

export function ChatSidebar({
  activeChatId,
  chats,
  open,
  onClose,
  onCreateChat,
  onDeleteChat,
  onRenameChat,
  onSelectChat,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = useMemo(
    () => getSearchResults(chats, searchQuery),
    [chats, searchQuery]
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-50 flex h-full w-80 flex-col border-r border-gray-800 bg-[#050816] transition-all duration-300 lg:relative lg:z-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="border-b border-gray-800 p-4">
          <button
            onClick={onCreateChat}
            className="w-full rounded-2xl bg-blue-600 py-3 font-medium transition hover:bg-blue-700"
          >
            + New Chat
          </button>

          <label className="mt-4 block">
            <span className="sr-only">Search chats</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search chats..."
              className="w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm outline-none transition placeholder:text-gray-500 focus:border-blue-500"
            />
          </label>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {searchResults.map(({ chat, preview }) => (
            <div
              key={chat.id}
              className={`group rounded-2xl border transition ${
                activeChatId === chat.id
                  ? "border-blue-500 bg-blue-600"
                  : "border-gray-800 bg-gray-900 hover:border-gray-700"
              }`}
            >
              <button
                onClick={() => onSelectChat(chat.id)}
                className="w-full px-4 pt-4 text-left"
              >
                <div className="truncate text-sm font-medium">
                  <HighlightedText text={chat.title} query={searchQuery} />
                </div>

                {preview && (
                  <div className="mt-2 line-clamp-2 text-xs leading-5 text-gray-300">
                    <HighlightedText text={preview} query={searchQuery} />
                  </div>
                )}
              </button>

              <div className="flex justify-end gap-2 p-3 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => onRenameChat(chat.id)}
                  className="rounded-lg bg-gray-800 px-2 py-1 text-xs hover:bg-gray-700"
                >
                  Rename
                </button>

                <button
                  onClick={() => onDeleteChat(chat.id)}
                  className="rounded-lg bg-red-600 px-2 py-1 text-xs hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {searchResults.length === 0 && (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-5 text-sm text-gray-400">
              No chats found.
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
