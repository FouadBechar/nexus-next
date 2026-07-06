import type { AiProvider } from "./types";

export const geminiProvider: AiProvider = {
  id: "gemini",
  async streamChat(request) {
    const { streamGeminiChat } = await import("../gemini");

    return streamGeminiChat(request);
  },
};
