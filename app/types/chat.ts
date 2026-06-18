import type { Message } from "./message";

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
};
