"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_CHAT_SETTINGS,
  type ChatSettings,
} from "../types/settings";

const SETTINGS_STORAGE_KEY = "nexus-chat-settings";

function parseSettings(value: string | null): ChatSettings {
  if (!value) return DEFAULT_CHAT_SETTINGS;

  try {
    const parsed = JSON.parse(value) as Partial<ChatSettings>;

    return {
      model: parsed.model || DEFAULT_CHAT_SETTINGS.model,
      temperature:
        typeof parsed.temperature === "number"
          ? parsed.temperature
          : DEFAULT_CHAT_SETTINGS.temperature,
      systemPrompt:
        typeof parsed.systemPrompt === "string"
          ? parsed.systemPrompt
          : DEFAULT_CHAT_SETTINGS.systemPrompt,
    };
  } catch {
    return DEFAULT_CHAT_SETTINGS;
  }
}

export function useChatSettings() {
  const [settings, setSettings] = useState<ChatSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_CHAT_SETTINGS;

    return parseSettings(localStorage.getItem(SETTINGS_STORAGE_KEY));
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function updateSettings(nextSettings: Partial<ChatSettings>) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      ...nextSettings,
    }));
  }

  function resetSettings() {
    setSettings(DEFAULT_CHAT_SETTINGS);
  }

  return {
    resetSettings,
    settings,
    updateSettings,
  };
}
