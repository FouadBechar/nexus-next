import type { ModelApiProvider } from "../../../app/types/model";
import type { StreamChatOptions } from "../types";

export type AiProviderRequest = StreamChatOptions;

export type AiProvider = {
  id: ModelApiProvider;
  streamChat: (request: AiProviderRequest) => Promise<Response>;
};
