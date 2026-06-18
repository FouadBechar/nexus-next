import { DEFAULT_MODEL_ID } from "../../lib/ai/models";

export type ResponseLength = "short" | "balanced" | "long";

export const DEFAULT_RESPONSE_LENGTH: ResponseLength = "balanced";

export const RESPONSE_LENGTH_OPTIONS: Array<{
  description: string;
  label: string;
  tokens: number;
  value: ResponseLength;
}> = [
  {
    description: "Concise replies",
    label: "Short",
    tokens: 512,
    value: "short",
  },
  {
    description: "Good default",
    label: "Balanced",
    tokens: 2048,
    value: "balanced",
  },
  {
    description: "More detail",
    label: "Long",
    tokens: 4096,
    value: "long",
  },
];

export type ChatSettings = {
  model: string;
  responseLength: ResponseLength;
  temperature: number;
  systemPrompt: string;
};

export const LEGACY_DEFAULT_SYSTEM_PROMPT =
  "You are Nexus AI, a helpful assistant.";

export const DEFAULT_SYSTEM_PROMPT =
  "You are Nexus AI, a helpful assistant inside the Nexus Next app. If asked about your underlying model or provider, answer truthfully and clearly.";

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  model: DEFAULT_MODEL_ID,
  responseLength: DEFAULT_RESPONSE_LENGTH,
  temperature: 0.7,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
};

export function isResponseLength(value: unknown): value is ResponseLength {
  return (
    value === "short" ||
    value === "balanced" ||
    value === "long"
  );
}

export function getMaxTokensForResponseLength(
  responseLength: ResponseLength
) {
  return (
    RESPONSE_LENGTH_OPTIONS.find((option) => option.value === responseLength)
      ?.tokens ?? RESPONSE_LENGTH_OPTIONS[1].tokens
  );
}
