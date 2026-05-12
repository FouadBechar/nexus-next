import type { Model } from "../../app/types/model";

export const DEFAULT_MODEL_ID = "openai/gpt-4o-mini";

export const MODELS: Model[] = [
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    speed: "fast",
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude Haiku",
    provider: "Anthropic",
    speed: "fast",
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    speed: "balanced",
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini Flash",
    provider: "Google",
    speed: "fast",
  },
];
