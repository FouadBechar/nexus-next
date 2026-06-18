import { getModelById } from "./models";
import { streamGeminiChat } from "./gemini";
import { streamOpenRouterChat } from "./openrouter";
import type { StreamChatOptions } from "./types";

export async function streamAiChat(options: StreamChatOptions) {
  const model = getModelById(options.model);
  const apiProvider = model?.apiProvider ?? "openrouter";
  const apiModel = model?.apiModel ?? options.model;
  const maxTokens =
    model?.maxOutputTokens && options.maxTokens
      ? Math.min(options.maxTokens, model.maxOutputTokens)
      : options.maxTokens;
  const providerOptions = {
    ...options,
    maxTokens,
    model: apiModel,
  };

  if (apiProvider === "gemini") {
    return streamGeminiChat(providerOptions);
  }

  return streamOpenRouterChat(providerOptions);
}
