import { logger } from "../logger";
import {
  createAttachmentEvent,
  emitAttachmentEvent,
  type AttachmentPipelineEventHandler,
} from "./events";
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

type RunAttachmentPipelineOptions = {
  onEvent?: AttachmentPipelineEventHandler;
};

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

async function completeExtraction(
  file: File,
  result: AttachmentPipelineResult,
  onEvent?: AttachmentPipelineEventHandler
) {
  await emitAttachmentEvent(
    onEvent,
    createAttachmentEvent(file, {
      type: "extractionCompleted",
      extractionStatus: result.extractionStatus,
      extractionTruncated: result.extractionTruncated,
      hasExtractedText: Boolean(result.extractedText?.trim()),
      pipelineStatus: result.pipelineStatus,
    })
  );

  return result;
}

export async function runAttachmentPipeline(
  file: File,
  options: RunAttachmentPipelineOptions = {}
): Promise<AttachmentPipelineResult> {
  await emitAttachmentEvent(
    options.onEvent,
    createAttachmentEvent(file, {
      type: "attachmentQueued",
    })
  );

  if (file.type.startsWith("image/")) {
    return completeExtraction(file, emptyResult(), options.onEvent);
  }

  await emitAttachmentEvent(
    options.onEvent,
    createAttachmentEvent(file, {
      type: "extractionStarted",
    })
  );

  if (isTextAttachment(file)) {
    const extraction = await extractTextAttachment(file);
    const result: AttachmentPipelineResult = {
      extractedText: extraction.extractedText,
      extractionStatus: toExtractionStatus(extraction.extractedText),
      extractionTruncated: extraction.truncated,
      pipelineStatus: "completed",
    };

    return completeExtraction(file, result, options.onEvent);
  }

  if (file.type === "application/pdf") {
    try {
      const { extractPdfAttachment } = await loadPdfExtractor();
      const extraction = await extractPdfAttachment(file);
      const result: AttachmentPipelineResult = {
        extractedText: extraction.extractedText,
        extractionStatus: toExtractionStatus(extraction.extractedText),
        extractionTruncated: extraction.truncated,
        pipelineStatus: "completed",
      };

      return completeExtraction(file, result, options.onEvent);
    } catch (error) {
      logger.warn("PDF extraction failed.", {
        error,
        fileName: file.name,
      });
      const { getPdfExtractionDetail, getPdfExtractionError } =
        await loadPdfExtractor();
      const result: AttachmentPipelineResult = {
        extractedText: "",
        extractionDetail: getPdfExtractionDetail(error),
        extractionError: getPdfExtractionError(error),
        extractionStatus: "failed",
        extractionTruncated: false,
        pipelineStatus: "failed",
      };

      await emitAttachmentEvent(
        options.onEvent,
        createAttachmentEvent(file, {
          type: "extractionFailed",
          extractionDetail: result.extractionDetail,
          extractionError: result.extractionError,
          pipelineStatus: "failed",
        })
      );

      return result;
    }
  }

  return completeExtraction(file, emptyResult(), options.onEvent);
}
