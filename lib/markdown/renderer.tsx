"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownRendererProps = {
  content: string;
};

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

function isRelativeUrl(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("#") ||
    value.startsWith("./") ||
    value.startsWith("../")
  );
}

function safeUrlTransform(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return "";

  if (isRelativeUrl(trimmedValue)) {
    return trimmedValue;
  }

  try {
    const url = new URL(trimmedValue);

    return SAFE_LINK_PROTOCOLS.has(url.protocol) ? trimmedValue : "";
  } catch {
    return "";
  }
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="min-w-0 overflow-hidden break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={safeUrlTransform}
        components={{
          a: ({ children, ...props }) => (
            <a
              {...props}
              className="text-blue-300 underline underline-offset-4 hover:text-blue-200"
              target="_blank"
              rel="noreferrer noopener"
            >
              {children}
            </a>
          ),
          code: ({ children, className, ...props }) => (
            <code
              {...props}
              className={`max-w-full rounded bg-black/40 px-1.5 py-0.5 font-mono text-sm break-words ${
                className ?? ""
              }`}
            >
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-4 max-w-full overflow-x-auto rounded-2xl border border-gray-700 bg-black/50 p-4">
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
