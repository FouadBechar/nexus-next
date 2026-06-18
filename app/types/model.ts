export type ModelSpeed = "fast" | "balanced" | "reasoning";
export type ModelApiProvider = "openrouter" | "gemini";

export type Model = {
  apiModel?: string;
  apiProvider: ModelApiProvider;
  id: string;
  maxOutputTokens?: number;
  name: string;
  provider: string;
  speed: ModelSpeed;
  supportsImages: boolean;
};
