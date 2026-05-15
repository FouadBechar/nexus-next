"use client";

import { KeyboardEvent, useEffect, useRef } from "react";

type ChatInputProps = {
  canExport?: boolean;
  error?: string;
  input: string;
  loading: boolean;
  onChange: (value: string) => void;
  onExportJson: () => void;
  onExportMarkdown: () => void;
  onRegenerate: () => void;
  onSend: () => void;
  onStop: () => void;
};

export function ChatInput({
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [input]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <div className="border-t border-gray-800 bg-black p-4">
      {error && (
        <div className="mb-3 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex items-end gap-3">
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
            onClick={onSend}
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
