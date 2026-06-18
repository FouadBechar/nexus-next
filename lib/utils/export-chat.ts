import type { Chat } from "../../app/types/chat";
import type { MessageAttachment } from "../../app/types/message";

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
        lines.push(
          `- ${attachment.fileName} (${attachment.mimeType}, ${
            attachment.fileSize
          } bytes${getAttachmentExtractionSummary(attachment)})`
        );
      }

      lines.push("");
    }
  }

  return lines.join("\n");
}

function getAttachmentExtractionSummary(attachment: MessageAttachment) {
  if (!attachment.extractionStatus) return "";

  return [
    `extraction: ${attachment.extractionStatus}`,
    attachment.extractionTruncated ? "truncated" : "",
    attachment.extractionError ? `error: ${attachment.extractionError}` : "",
    attachment.extractionDetail ? `detail: ${attachment.extractionDetail}` : "",
  ]
    .filter(Boolean)
    .join(", ")
    .replace(/^/, ", ");
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
    JSON.stringify(sanitizeChatForExport(chat), null, 2),
    "application/json;charset=utf-8"
  );
}

function sanitizeAttachmentForExport(attachment: MessageAttachment) {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
    extractionStatus: attachment.extractionStatus,
    extractionError: attachment.extractionError,
    extractionDetail: attachment.extractionDetail,
    extractionTruncated: attachment.extractionTruncated,
    extractedText: attachment.extractedText,
  };
}

export function sanitizeChatForExport(chat: Chat) {
  return {
    ...chat,
    messages: chat.messages.map((message) => ({
      ...message,
      attachments: message.attachments?.map(sanitizeAttachmentForExport),
    })),
  };
}
