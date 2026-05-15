import { DEFAULT_MODEL_ID } from "../../lib/ai/models";

export type ChatSettings = {
  model: string;
  temperature: number;
  systemPrompt: string;
};

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  model: DEFAULT_MODEL_ID,
  temperature: 0.7,
  systemPrompt: "You are Nexus AI, a helpful assistant.",
};
