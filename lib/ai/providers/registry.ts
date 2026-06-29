import type { ModelApiProvider } from "../../../app/types/model";
import { geminiProvider } from "./gemini";
import { openRouterProvider } from "./openrouter";
import type { AiProvider } from "./types";

const providers = new Map<ModelApiProvider, AiProvider>(
  [openRouterProvider, geminiProvider].map((provider) => [
    provider.id,
    provider,
  ])
);

export const providerRegistry = {
  get(providerId: ModelApiProvider) {
    const provider = providers.get(providerId);

    if (!provider) {
      throw new Error(`AI provider "${providerId}" is not registered.`);
    }

    return provider;
  },

  list() {
    return Array.from(providers.values());
  },
};
