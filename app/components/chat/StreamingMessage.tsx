"use client";

import { MarkdownRenderer } from "../../../lib/markdown/renderer";

type StreamingMessageProps = {
  content: string;
};

export function StreamingMessage({ content }: StreamingMessageProps) {
  if (!content) return null;

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 px-5 py-4 text-[15px] leading-8 shadow-lg">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
