import type { AiProvider } from "./types";

export const openRouterProvider: AiProvider = {
  id: "openrouter",
  async streamChat(request) {
    const { streamOpenRouterChat } = await import("../openrouter");

    return streamOpenRouterChat(request);
  },
};
