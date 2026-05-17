export type MessageAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  extractionStatus?: "readable" | "empty" | "failed";
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
