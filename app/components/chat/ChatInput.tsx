"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { getAttachmentDisplayInfo } from "../../../lib/utils/attachments";

type ChatInputProps = {
  attachmentsEnabled?: boolean;
  canExport?: boolean;
  error?: string;
  input: string;
  loading: boolean;
  onChange: (value: string) => void;
  onExportJson: () => void;
  onExportMarkdown: () => void;
  onRegenerate: () => void;
  onSend: (files?: File[]) => Promise<void> | void;
  onStop: () => void;
};

export function ChatInput({
  attachmentsEnabled = false,
  canExport = false,
  error,
  input,
  loading,
  onChange,
  onExportJson,
  onExportMarkdown,
  onRegenerate,
  onSend,
  onStop,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [input]);

  async function handleSend() {
    await onSend(files);
    setFiles([]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function removeFile(index: number) {
    setFiles((currentFiles) =>
      currentFiles.filter((_file, fileIndex) => fileIndex !== index)
    );
  }

  return (
    <div className="border-t border-gray-800 bg-black p-4">
      {error && (
        <div className="mb-3 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="mb-3 grid gap-2">
          {files.map((file, index) => (
            <SelectedFilePreview
              key={`${file.name}-${file.size}-${index}`}
              file={file}
              onRemove={() => removeFile(index)}
            />
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,application/pdf,text/plain,text/markdown"
          className="hidden"
          onChange={(event) => {
            setFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!attachmentsEnabled || loading}
          className="rounded-2xl border border-gray-800 px-4 py-4 text-sm text-gray-300 transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
          title={
            attachmentsEnabled
              ? "Attach files"
              : "Sign in to upload attachments"
          }
        >
          Attach
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask anything..."
          className="max-h-40 flex-1 resize-none overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 px-5 py-4 outline-none focus:border-blue-500"
          onKeyDown={handleKeyDown}
        />

        {loading ? (
          <button
            onClick={onStop}
            className="rounded-2xl bg-red-600 px-6 py-4 transition hover:bg-red-700"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={handleSend}
            className="rounded-2xl bg-blue-600 px-6 py-4 transition hover:bg-blue-700"
          >
            Send
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <button onClick={onRegenerate} className="hover:text-white">
          Regenerate Response
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onExportMarkdown}
            disabled={!canExport}
            className="hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Export MD
          </button>

          <button
            onClick={onExportJson}
            disabled={!canExport}
            className="hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Export JSON
          </button>

          <span>Nexus Next v1</span>
        </div>
      </div>
    </div>
  );
}

function SelectedFilePreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const displayInfo = getAttachmentDisplayInfo({
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  });

  return (
    <div className="flex max-w-full items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-gray-300">
      <div className="min-w-0">
        <div className="truncate font-medium">{displayInfo.fileName}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-gray-500">
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

      <button onClick={onRemove} className="shrink-0 text-gray-500 hover:text-white">
        Remove
      </button>
    </div>
  );
}
