"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { Chat } from "../types/chat";
import type { Message } from "../types/message";

const CHAT_STORAGE_KEY = "nexus-chats";

function createChat(title = "New Chat"): Chat {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? Date.now().toString(),
    title,
    messages: [],
  };
}

function parseSavedChats(value: string | null): Chat[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type ChatState = {
  hydrated: boolean;
  chats: Chat[];
  activeChatId: string;
};

type ChatAction =
  | {
      type: "hydrate";
      chats: Chat[];
    }
  | {
      type: "create";
      chat: Chat;
    }
  | {
      type: "delete";
      id: string;
    }
  | {
      type: "rename";
      id: string;
      title: string;
    }
  | {
      type: "set-active";
      id: string;
    }
  | {
      type: "update-messages";
      id: string;
      messages: Message[];
      title?: string;
    }
  | {
      type: "set-hydrated";
    };

const initialState: ChatState = {
  hydrated: false,
  chats: [],
  activeChatId: "",
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "hydrate": {
      const chats = action.chats.length > 0 ? action.chats : [createChat()];

      return {
        hydrated: true,
        chats,
        activeChatId: chats[0].id,
      };
    }

    case "create":
      return {
        ...state,
        chats: [action.chat, ...state.chats],
        activeChatId: action.chat.id,
      };

    case "delete": {
      const filtered = state.chats.filter((chat) => chat.id !== action.id);

      if (filtered.length === 0) {
        const newChat = createChat();

        return {
          ...state,
          chats: [newChat],
          activeChatId: newChat.id,
        };
      }

      return {
        ...state,
        chats: filtered,
        activeChatId:
          state.activeChatId === action.id ? filtered[0].id : state.activeChatId,
      };
    }

    case "rename": {
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.id
            ? {
                ...chat,
                title: action.title,
              }
            : chat
        ),
      };
    }

    case "set-active":
      return {
        ...state,
        activeChatId: action.id,
      };

    case "update-messages":
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.id
            ? {
                ...chat,
                title: action.title ?? chat.title,
                messages: action.messages,
              }
            : chat
        ),
      };

    case "set-hydrated":
      return {
        ...state,
        hydrated: true,
      };
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

async function createRemoteChat(chat: Chat) {
  return requestJson<{ chat: Chat }>("/api/chats", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: chat.id,
      title: chat.title,
    }),
  });
}

export function useChats(userId?: string | null, authLoaded = true) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const remoteEnabled = Boolean(userId);

  useEffect(() => {
    if (!authLoaded) return;

    let cancelled = false;

    async function hydrateChats() {
      try {
        if (remoteEnabled) {
          const { chats } = await requestJson<{ chats: Chat[] }>("/api/chats");

          if (cancelled) return;

          if (chats.length > 0) {
            dispatch({ type: "hydrate", chats });
            return;
          }

          const firstChat = createChat();
          await createRemoteChat(firstChat);

          if (!cancelled) {
            dispatch({ type: "hydrate", chats: [firstChat] });
          }

          return;
        }

        const savedChats = parseSavedChats(localStorage.getItem(CHAT_STORAGE_KEY));

        if (!cancelled) {
          dispatch({ type: "hydrate", chats: savedChats });
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          const savedChats = parseSavedChats(localStorage.getItem(CHAT_STORAGE_KEY));
          dispatch({ type: "hydrate", chats: savedChats });
        }
      }
    }

    hydrateChats();

    return () => {
      cancelled = true;
    };
  }, [authLoaded, remoteEnabled]);

  useEffect(() => {
    if (!state.hydrated || remoteEnabled) return;

    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state.chats));
  }, [remoteEnabled, state.chats, state.hydrated]);

  const activeChat = useMemo(
    () => state.chats.find((chat) => chat.id === state.activeChatId),
    [state.activeChatId, state.chats]
  );

  const createNewChat = useCallback(() => {
    const newChat = createChat();

    dispatch({
      type: "create",
      chat: newChat,
    });

    if (remoteEnabled) {
      createRemoteChat(newChat).catch(console.error);
    }

    return newChat;
  }, [remoteEnabled]);

  const deleteChat = useCallback((id: string) => {
    dispatch({
      type: "delete",
      id,
    });

    if (remoteEnabled) {
      fetch(`/api/chats/${id}`, {
        method: "DELETE",
      }).catch(console.error);
    }
  }, [remoteEnabled]);

  const renameChat = useCallback((id: string, title: string) => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) return;

    dispatch({
      type: "rename",
      id,
      title: trimmedTitle,
    });

    if (remoteEnabled) {
      fetch(`/api/chats/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
        }),
      }).catch(console.error);
    }
  }, [remoteEnabled]);

  const updateChatMessages = useCallback(
    (id: string, messages: Message[], title?: string) => {
      dispatch({
        type: "update-messages",
        id,
        messages,
        title,
      });

      if (remoteEnabled) {
        fetch(`/api/chats/${id}/messages`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages,
            title,
          }),
        }).catch(console.error);
      }
    },
    [remoteEnabled]
  );

  const setActiveChatId = useCallback((id: string) => {
    dispatch({
      type: "set-active",
      id,
    });
  }, []);

  return {
    activeChat,
    activeChatId: state.activeChatId,
    chats: state.chats,
    createNewChat,
    deleteChat,
    renameChat,
    setActiveChatId,
    updateChatMessages,
  };
}
