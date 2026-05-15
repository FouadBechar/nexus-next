import type { Chat } from "../../app/types/chat";

function safeFileName(value: string) {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || "chat";
}

function downloadFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function chatToMarkdown(chat: Chat) {
  const lines = [`# ${chat.title}`, ""];

  for (const message of chat.messages) {
    const role = message.role === "user" ? "User" : "Assistant";
    const timestamp = message.createdAt
      ? ` _${new Date(message.createdAt).toLocaleString()}_`
      : "";

    lines.push(`## ${role}${timestamp}`, "", message.content, "");

    if (message.attachments && message.attachments.length > 0) {
      lines.push("Attachments:", "");

      for (const attachment of message.attachments) {
        lines.push(`- [${attachment.fileName}](${attachment.url})`);
      }

      lines.push("");
    }
  }

  return lines.join("\n");
}

export function exportChatAsMarkdown(chat: Chat) {
  downloadFile(
    `${safeFileName(chat.title)}.md`,
    chatToMarkdown(chat),
    "text/markdown;charset=utf-8"
  );
}

export function exportChatAsJson(chat: Chat) {
  downloadFile(
    `${safeFileName(chat.title)}.json`,
    JSON.stringify(chat, null, 2),
    "application/json;charset=utf-8"
  );
}
