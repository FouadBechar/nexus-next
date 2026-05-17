"use client";

import type { Message } from "../../types/message";
import { MarkdownRenderer } from "../../../lib/markdown/renderer";
import { getAttachmentDisplayInfo } from "../../../lib/utils/attachments";

type ChatMessageProps = {
  message: Message;
  onCopy: (text: string) => void;
};

export function ChatMessage({ message, onCopy }: ChatMessageProps) {
  return (
    <div
      className={`min-w-0 flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`min-w-0 max-w-[min(85%,_56rem)] animate-in overflow-hidden rounded-3xl px-5 py-4 text-[15px] leading-8 shadow-lg duration-300 fade-in ${
          message.role === "user"
            ? "bg-blue-600 text-white"
            : "border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800"
        }`}
      >
        <MarkdownRenderer content={message.content} />

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-4 grid gap-3">
            {message.attachments.map((attachment) => (
              <AttachmentCard key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}

        <div className="mt-4 flex min-w-0 items-center justify-between gap-3 border-t border-gray-700 pt-4">
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

function AttachmentCard({
  attachment,
}: {
  attachment: NonNullable<Message["attachments"]>[number];
}) {
  const displayInfo = getAttachmentDisplayInfo({
    fileName: attachment.fileName,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType,
  });

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-2xl border border-gray-700 bg-black/30"
    >
      {attachment.mimeType.startsWith("image/") && attachment.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachment.url}
          alt={attachment.fileName}
          className="max-h-80 w-full object-contain"
        />
      ) : (
        <div className="p-4 text-sm text-gray-300">
          <div className="truncate font-medium">{attachment.fileName}</div>
        </div>
      )}

      <div className="border-t border-gray-800 px-4 py-3 text-xs text-gray-400">
        <div className="flex flex-wrap items-center gap-2">
          <span>{displayInfo.typeLabel}</span>
          <span>{displayInfo.fileSizeLabel}</span>
          <span
            className={`rounded-full px-2 py-0.5 ${
              displayInfo.aiReadable
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            {displayInfo.statusLabel}
          </span>
        </div>
      </div>
    </a>
  );
}
