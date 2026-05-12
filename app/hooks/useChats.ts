"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { Chat } from "../types/chat";
import type { Message } from "../types/message";

const CHAT_STORAGE_KEY = "nexus-chats";

function createChat(title = "New Chat"): Chat {
  return {
    id: Date.now().toString(),
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
  }
}

export function useChats() {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  useEffect(() => {
    const savedChats = parseSavedChats(localStorage.getItem(CHAT_STORAGE_KEY));
    dispatch({ type: "hydrate", chats: savedChats });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;

    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state.chats));
  }, [state.chats, state.hydrated]);

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

    return newChat;
  }, []);

  const deleteChat = useCallback((id: string) => {
    dispatch({
      type: "delete",
      id,
    });
  }, []);

  const renameChat = useCallback((id: string, title: string) => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) return;

    dispatch({
      type: "rename",
      id,
      title: trimmedTitle,
    });
  }, []);

  const updateChatMessages = useCallback(
    (id: string, messages: Message[], title?: string) => {
      dispatch({
        type: "update-messages",
        id,
        messages,
        title,
      });
    },
    []
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
