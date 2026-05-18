import type { Model } from "../../app/types/model";

export const DEFAULT_MODEL_ID = "openai/gpt-4o-mini";

export const MODELS: Model[] = [
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    speed: "fast",
    supportsImages: true,
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude Haiku",
    provider: "Anthropic",
    speed: "fast",
    supportsImages: true,
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    speed: "balanced",
    supportsImages: false,
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini Flash",
    provider: "Google",
    speed: "fast",
    supportsImages: true,
  },
];

export function getModelById(modelId: string) {
  return MODELS.find((model) => model.id === modelId);
}

export function modelSupportsImages(modelId: string) {
  return Boolean(getModelById(modelId)?.supportsImages);
}
