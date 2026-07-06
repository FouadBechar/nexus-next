import { logger } from "../logger";
import { extractTextAttachment, isTextAttachment } from "./extractors/text";
import type { AttachmentPipelineResult } from "./types";

type PdfExtractorModule = {
  extractPdfAttachment: (
    file: File
  ) => Promise<{
    extractedText: string;
    truncated: boolean;
  }>;
  getPdfExtractionDetail: (error: unknown) => string;
  getPdfExtractionError: (
    error: unknown
  ) => NonNullable<AttachmentPipelineResult["extractionError"]>;
};

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

async function loadPdfExtractor() {
  const extractorPath = "./extractors/pdf";

  return import(extractorPath) as Promise<PdfExtractorModule>;
}

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
      const { extractPdfAttachment } = await loadPdfExtractor();
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
      const { getPdfExtractionDetail, getPdfExtractionError } =
        await loadPdfExtractor();

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
