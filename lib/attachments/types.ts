export type AttachmentPipelineStatus =
  | "uploaded"
  | "queued"
  | "extracting"
  | "completed"
  | "indexed"
  | "failed";

export type AttachmentExtractionStatus = "readable" | "empty" | "failed";

export type AttachmentExtractionError =
  | "parser_failed"
  | "encrypted_or_protected";

export type AttachmentPipelineResult = {
  extractedText: string;
  extractionDetail?: string;
  extractionError?: AttachmentExtractionError;
  extractionStatus?: AttachmentExtractionStatus;
  extractionTruncated: boolean;
  pipelineStatus: AttachmentPipelineStatus;
};
