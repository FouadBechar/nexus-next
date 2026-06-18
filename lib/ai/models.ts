import type { Model } from "../../app/types/model";

export const DEFAULT_MODEL_ID = "openai/gpt-4o-mini";

export type ModelCapabilityBadge = {
  label: string;
  tone: "default" | "success" | "muted";
};

export const MODELS: Model[] = [
  {
    apiProvider: "openrouter",
    id: "openai/gpt-4o-mini",
    maxOutputTokens: 1024,
    name: "GPT-4o Mini",
    provider: "OpenAI",
    speed: "fast",
    supportsImages: true,
  },
  {
    apiProvider: "openrouter",
    id: "anthropic/claude-3-haiku",
    name: "Claude Haiku",
    provider: "Anthropic",
    speed: "fast",
    supportsImages: true,
  },
  {
    apiProvider: "openrouter",
    id: "deepseek/deepseek-chat",
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    speed: "balanced",
    supportsImages: false,
  },
  {
    apiProvider: "openrouter",
    id: "google/gemini-2.0-flash-001",
    name: "Gemini Flash",
    provider: "Google via OpenRouter",
    speed: "fast",
    supportsImages: true,
  },
  {
    apiModel: "gemini-2.5-flash",
    apiProvider: "gemini",
    id: "gemini/gemini-2.5-flash",
    name: "Gemini 2.5 Flash Direct",
    provider: "Google AI Studio",
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

export function getModelProviderBadgeLabel(model: Model) {
  return model.apiProvider === "gemini" ? "Google Direct" : "OpenRouter";
}

export function getModelProviderHint(model: Model) {
  return model.apiProvider === "gemini"
    ? "Requests go directly to Google AI Studio with your Gemini API key."
    : "Requests are routed through OpenRouter for multi-provider access.";
}

export function getModelCapabilityBadges(model: Model): ModelCapabilityBadge[] {
  return [
    {
      label: "Text",
      tone: "default",
    },
    {
      label: "Text files",
      tone: "success",
    },
    {
      label: model.supportsImages ? "Images" : "No images",
      tone: model.supportsImages ? "success" : "muted",
    },
    {
      label: getModelProviderBadgeLabel(model),
      tone: model.apiProvider === "gemini" ? "success" : "default",
    },
  ];
}
