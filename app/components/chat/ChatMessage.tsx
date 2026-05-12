"use client";

import type { Message } from "../../types/message";
import { MarkdownRenderer } from "../../../lib/markdown/renderer";

type ChatMessageProps = {
  message: Message;
  onCopy: (text: string) => void;
};

export function ChatMessage({ message, onCopy }: ChatMessageProps) {
  return (
    <div
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[85%] animate-in rounded-3xl px-5 py-4 text-[15px] leading-8 shadow-lg duration-300 fade-in ${
          message.role === "user"
            ? "bg-blue-600 text-white"
            : "border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800"
        }`}
      >
        <MarkdownRenderer content={message.content} />

        <div className="mt-4 flex items-center justify-between border-t border-gray-700 pt-4">
          <span className="text-xs text-gray-400">
            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : ""}
          </span>

          <button
            onClick={() => onCopy(message.content)}
            className="text-xs text-gray-400 hover:text-white"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
