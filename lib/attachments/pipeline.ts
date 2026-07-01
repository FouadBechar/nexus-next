import { logger } from "../logger";
import {
  extractPdfAttachment,
  getPdfExtractionDetail,
  getPdfExtractionError,
} from "./extractors/pdf";
import { extractTextAttachment, isTextAttachment } from "./extractors/text";
import type { AttachmentPipelineResult } from "./types";

export const ATTACHMENTS_BUCKET = "chat-attachments";
export const MAX_ATTACHMENT_FILE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
]);

function emptyResult(
  pipelineStatus: AttachmentPipelineResult["pipelineStatus"] = "completed"
): AttachmentPipelineResult {
  return {
    extractedText: "",
    extractionTruncated: false,
    pipelineStatus,
  };
}

function toExtractionStatus(extractedText: string) {
  return extractedText.trim() ? "readable" : "empty";
}

export async function runAttachmentPipeline(
  file: File
): Promise<AttachmentPipelineResult> {
  if (file.type.startsWith("image/")) {
    return emptyResult();
  }

  if (isTextAttachment(file)) {
    const extraction = await extractTextAttachment(file);

    return {
      extractedText: extraction.extractedText,
      extractionStatus: toExtractionStatus(extraction.extractedText),
      extractionTruncated: extraction.truncated,
      pipelineStatus: "completed",
    };
  }

  if (file.type === "application/pdf") {
    try {
      const extraction = await extractPdfAttachment(file);

      return {
        extractedText: extraction.extractedText,
        extractionStatus: toExtractionStatus(extraction.extractedText),
        extractionTruncated: extraction.truncated,
        pipelineStatus: "completed",
      };
    } catch (error) {
      logger.warn("PDF extraction failed.", {
        error,
        fileName: file.name,
      });

      return {
        extractedText: "",
        extractionDetail: getPdfExtractionDetail(error),
        extractionError: getPdfExtractionError(error),
        extractionStatus: "failed",
        extractionTruncated: false,
        pipelineStatus: "failed",
      };
    }
  }

  return emptyResult();
}
