import { z } from "zod";

export const MAX_CHAT_TITLE_CHARS = 160;
export const MAX_PERSISTED_MESSAGES = 80;
export const MAX_PERSISTED_MESSAGE_CHARS = 100_000;
export const MAX_PERSISTED_CONVERSATION_CHARS = 200_000;

const optionalMessageIdSchema = z.string().uuid().optional();

export const chatCreateSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(MAX_CHAT_TITLE_CHARS).optional(),
});

export const chatTitleSchema = z.object({
  title: z.string().trim().min(1).max(MAX_CHAT_TITLE_CHARS),
});

export const persistedMessageSchema = z.object({
  id: optionalMessageIdSchema,
  role: z.enum(["user", "assistant"]),
  content: z.string().max(MAX_PERSISTED_MESSAGE_CHARS),
  createdAt: z.string().datetime().optional(),
});

export const messagesSaveSchema = z
  .object({
    messages: z.array(persistedMessageSchema).max(MAX_PERSISTED_MESSAGES),
    title: z.string().trim().min(1).max(MAX_CHAT_TITLE_CHARS).optional(),
  })
  .refine(
    ({ messages }) =>
      messages.reduce((total, message) => total + message.content.length, 0) <=
      MAX_PERSISTED_CONVERSATION_CHARS,
    {
      message: "The saved conversation is too large.",
      path: ["messages"],
    }
  );

export const attachmentUploadSchema = z.object({
  chatId: z.string().uuid(),
  content: z.string().min(1).max(MAX_PERSISTED_MESSAGE_CHARS),
  messageId: z.string().uuid(),
});
