export type Message = {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};
