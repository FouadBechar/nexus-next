import { PdfExtractionError, extractPdfText } from "../../pdf/extract";
import type { AttachmentExtractionError } from "../types";

export async function extractPdfAttachment(file: File) {
  return extractPdfText(file);
}

export function getPdfExtractionError(
  error: unknown
): AttachmentExtractionError {
  if (
    error instanceof PdfExtractionError &&
    error.detail === "password_required"
  ) {
    return "encrypted_or_protected";
  }

  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (
    message.includes("password") ||
    message.includes("encrypted") ||
    message.includes("protected")
  ) {
    return "encrypted_or_protected";
  }

  return "parser_failed";
}

export function getPdfExtractionDetail(error: unknown) {
  if (error instanceof PdfExtractionError) {
    return error.diagnostic ?? error.detail;
  }

  if (error instanceof Error) {
    return `unknown_error: ${error.name}: ${error.message}`
      .replace(/\s+/g, " ")
      .slice(0, 240);
  }

  return "unknown_error";
}
