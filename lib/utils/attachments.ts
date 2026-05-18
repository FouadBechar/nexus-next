type AttachmentLike = {
  extractionStatus?: "readable" | "empty" | "failed";
  extractionTruncated?: boolean;
  extractedText?: string;
  fileName?: string;
  mimeType: string;
  fileSize: number;
  modelSupportsImages?: boolean;
  name?: string;
  size?: number;
  type?: string;
};

const TEXT_ATTACHMENT_TYPES = new Set(["text/plain", "text/markdown"]);

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) return `${kilobytes.toFixed(1)} KB`;

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

export function getAttachmentTypeLabel(mimeType: string, fileName = "") {
  const lowerName = fileName.toLowerCase();

  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "text/markdown" || lowerName.endsWith(".md")) {
    return "Markdown";
  }
  if (mimeType === "text/plain" || lowerName.endsWith(".txt")) return "Text";

  return "File";
}

export function isAiReadableAttachment(mimeType: string, fileName = "") {
  const lowerName = fileName.toLowerCase();

  return (
    TEXT_ATTACHMENT_TYPES.has(mimeType) ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".markdown")
  );
}

export function isImageAttachment(mimeType: string) {
  return mimeType.startsWith("image/");
}

export function getAttachmentDisplayInfo(attachment: AttachmentLike) {
  const fileName = attachment.fileName ?? attachment.name ?? "Attachment";
  const mimeType = attachment.mimeType || attachment.type || "";
  const fileSize = attachment.fileSize || attachment.size || 0;
  const imageReadable =
    isImageAttachment(mimeType) && Boolean(attachment.modelSupportsImages);
  const aiReadable =
    imageReadable ||
    attachment.extractionStatus === "readable" ||
    Boolean(attachment.extractedText?.trim()) ||
    isAiReadableAttachment(mimeType, fileName);
  const statusLabel =
    attachment.extractionStatus === "empty"
      ? "No extractable text"
      : attachment.extractionStatus === "failed"
        ? "Extraction failed"
        : aiReadable
          ? attachment.extractionTruncated
            ? "AI-readable · truncated"
            : "AI-readable"
          : "Stored only";

  return {
    aiReadable,
    fileName,
    fileSizeLabel: formatFileSize(fileSize),
    typeLabel: getAttachmentTypeLabel(mimeType, fileName),
    statusLabel,
  };
}
