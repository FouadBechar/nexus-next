import { streamGeminiChat } from "../gemini";
import type { AiProvider } from "./types";

export const geminiProvider: AiProvider = {
  id: "gemini",
  streamChat: streamGeminiChat,
};
