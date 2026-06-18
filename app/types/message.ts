export type MessageAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  extractionStatus?: "readable" | "empty" | "failed";
  extractionError?: "parser_failed" | "encrypted_or_protected";
  extractionDetail?: string;
  extractionTruncated?: boolean;
  extractedText?: string;
};

export type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  attachments?: MessageAttachment[];
};
