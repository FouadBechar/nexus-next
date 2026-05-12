export type ModelSpeed = "fast" | "balanced" | "reasoning";

export type Model = {
  id: string;
  name: string;
  provider: string;
  speed: ModelSpeed;
};
