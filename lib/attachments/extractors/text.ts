const MAX_EXTRACTED_TEXT_CHARS = 60_000;
const TEXT_MIME_TYPES = new Set(["text/plain", "text/markdown"]);

export function isTextAttachment(file: File) {
  const lowerName = file.name.toLowerCase();

  return (
    TEXT_MIME_TYPES.has(file.type) ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".markdown")
  );
}

export async function extractTextAttachment(file: File) {
  const text = (await file.text()).trim();

  if (!text) {
    return {
      extractedText: "",
      truncated: false,
    };
  }

  return {
    extractedText:
      text.length > MAX_EXTRACTED_TEXT_CHARS
        ? text.slice(0, MAX_EXTRACTED_TEXT_CHARS)
        : text,
    truncated: text.length > MAX_EXTRACTED_TEXT_CHARS,
  };
}
