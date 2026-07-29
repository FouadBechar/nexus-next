"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { safeUrlTransform } from "./url";

type MarkdownRendererProps = {
  content: string;
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="min-w-0 overflow-hidden break-words [&>*+*]:mt-4 [&_blockquote]:border-l-2 [&_blockquote]:border-gray-600 [&_blockquote]:pl-4 [&_blockquote]:text-gray-300 [&_li+li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:leading-7 [&_ul]:list-disc [&_ul]:pl-5">
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
              className={`max-w-full rounded-md bg-black/45 px-1.5 py-0.5 font-mono text-sm break-words text-gray-100 ${
                className ?? ""
              }`}
            >
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-4 max-w-full overflow-x-auto rounded-lg border border-gray-700 bg-black/55 p-4 text-sm leading-6">
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
