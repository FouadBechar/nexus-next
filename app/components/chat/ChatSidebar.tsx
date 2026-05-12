"use client";

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
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {chats.map((chat) => (
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
                <div className="truncate text-sm font-medium">{chat.title}</div>
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
        </div>
      </aside>
    </>
  );
}
