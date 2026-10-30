"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toSpeechText } from "../../lib/utils/voice";

function subscribeToBrowserCapability() {
  return () => undefined;
}

function getSpeechSynthesisSupport() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

export function useSpeechSynthesis() {
  const activeMessageIdRef = useRef<string | null>(null);
  const isSupported = useSyncExternalStore(
    subscribeToBrowserCapability,
    getSpeechSynthesisSupport,
    () => false
  );
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    activeMessageIdRef.current = null;
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
  }, []);

  useEffect(() => {
    return stopSpeaking;
  }, [stopSpeaking]);

  const speak = useCallback(
    (messageId: string, content: string) => {
      if (
        typeof window === "undefined" ||
        !("speechSynthesis" in window) ||
        !("SpeechSynthesisUtterance" in window)
      ) {
        return;
      }

      const text = toSpeechText(content);

      if (!text) return;

      window.speechSynthesis.cancel();
      activeMessageIdRef.current = messageId;
      setSpeakingMessageId(messageId);

      const utterance = new SpeechSynthesisUtterance(text);
      const clearActiveMessage = () => {
        if (activeMessageIdRef.current === messageId) {
          activeMessageIdRef.current = null;
          setSpeakingMessageId(null);
        }
      };

      utterance.onend = clearActiveMessage;
      utterance.onerror = clearActiveMessage;
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  return {
    isSupported,
    speakingMessageId,
    speak,
    stopSpeaking,
  };
}
