"use client";

import { memo, useMemo } from "react";
import type { Message } from "../../types/message";
import { MarkdownRenderer } from "../../../lib/markdown/renderer";
import { getAttachmentDisplayInfo } from "../../../lib/utils/attachments";

type ChatMessageProps = {
  isSpeaking?: boolean;
  message: Message;
  messageId: string;
  modelSupportsImages?: boolean;
  onCopy: (text: string) => void;
  onToggleSpeech?: (messageId: string, content: string) => void;
  speechSupported?: boolean;
};

export const ChatMessage = memo(function ChatMessage({
  isSpeaking = false,
  message,
  messageId,
  modelSupportsImages = false,
  onCopy,
  onToggleSpeech,
  speechSupported = false,
}: ChatMessageProps) {
  const createdAtLabel = useMemo(
    () => (message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : ""),
    [message.createdAt]
  );

  return (
    <div
      className={`min-w-0 flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`min-w-0 max-w-[min(88%,_58rem)] animate-in overflow-hidden rounded-2xl px-5 py-4 text-[15px] leading-7 shadow-lg duration-300 fade-in sm:px-6 ${
          message.role === "user"
            ? "bg-blue-600 text-white shadow-blue-950/20"
            : "border border-gray-800 bg-gray-950 shadow-black/20"
        }`}
      >
        <MarkdownRenderer content={message.content} />

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-4 grid gap-3">
            {message.attachments.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                attachment={attachment}
                modelSupportsImages={modelSupportsImages}
              />
            ))}
          </div>
        )}

        <div className="mt-4 flex min-w-0 items-center justify-between gap-3 border-t border-white/10 pt-3">
          <span className="text-xs text-gray-500">
            {createdAtLabel}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onCopy(message.content)}
              className="rounded-md px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              Copy
            </button>

            {message.role === "assistant" && speechSupported && onToggleSpeech && (
              <button
                onClick={() => onToggleSpeech(messageId, message.content)}
                aria-pressed={isSpeaking}
                className="rounded-md px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                {isSpeaking ? "Stop reading" : "Read aloud"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const AttachmentCard = memo(function AttachmentCard({
  attachment,
  modelSupportsImages,
}: {
  attachment: NonNullable<Message["attachments"]>[number];
  modelSupportsImages: boolean;
}) {
  const displayInfo = useMemo(
    () =>
      getAttachmentDisplayInfo({
        extractionDetail: attachment.extractionDetail,
        extractionError: attachment.extractionError,
        extractionStatus: attachment.extractionStatus,
        extractionTruncated: attachment.extractionTruncated,
        extractedText: attachment.extractedText,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        modelSupportsImages,
      }),
    [
      attachment.extractionDetail,
      attachment.extractionError,
      attachment.extractionStatus,
      attachment.extractionTruncated,
      attachment.extractedText,
      attachment.fileName,
      attachment.fileSize,
      attachment.mimeType,
      modelSupportsImages,
    ]
  );

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer noopener"
      className="block overflow-hidden rounded-lg border border-gray-700 bg-black/30 transition hover:border-gray-500 hover:bg-black/40"
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
          <div className="truncate font-medium text-gray-100">
            {attachment.fileName}
          </div>
        </div>
      )}

      <div className="border-t border-gray-800 px-4 py-3 text-xs text-gray-400">
        <div className="flex flex-wrap items-center gap-2">
          <span>{displayInfo.typeLabel}</span>
          <span className="text-gray-600">/</span>
          <span>{displayInfo.fileSizeLabel}</span>
          <span
            className={`rounded-md px-2 py-0.5 font-medium ${
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
});
