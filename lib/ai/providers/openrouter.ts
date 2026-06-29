import { streamOpenRouterChat } from "../openrouter";
import type { AiProvider } from "./types";

export const openRouterProvider: AiProvider = {
  id: "openrouter",
  streamChat: streamOpenRouterChat,
};
