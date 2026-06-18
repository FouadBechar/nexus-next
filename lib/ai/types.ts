export type AttachmentPayload = {
  fileName?: string;
  mimeType: string;
  url: string;
};

export type AiContentPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image_url";
      image_url: {
        url: string;
      };
    };

export type AiMessage = {
  role: "user" | "assistant" | "system";
  content: string | AiContentPart[];
  attachments?: AttachmentPayload[];
};

export type StreamChatOptions = {
  maxTokens?: number;
  messages: AiMessage[];
  model: string;
  systemPrompt?: string;
  temperature?: number;
};

