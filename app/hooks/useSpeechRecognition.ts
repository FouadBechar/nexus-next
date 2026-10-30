"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return undefined;

  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

function subscribeToBrowserCapability() {
  return () => undefined;
}

function getSpeechRecognitionSupport() {
  return Boolean(getSpeechRecognitionConstructor());
}

function getErrorMessage(error: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Microphone access was not allowed.";
  }

  if (error === "no-speech") {
    return "No speech was detected. Try again.";
  }

  return "Dictation stopped unexpectedly. Try again.";
}

export function useSpeechRecognition(
  onTranscript: (transcript: string) => void
) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const isSupported = useSyncExternalStore(
    subscribeToBrowserCapability,
    getSpeechRecognitionSupport,
    () => false
  );

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    const Recognition = getSpeechRecognitionConstructor();

    if (!Recognition || isListening) return;

    setError(null);
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join("");

      onTranscriptRef.current(transcript.trim());
    };
    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setError(getErrorMessage(event.error));
      }
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    setIsListening(true);

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setError("Dictation could not start. Try again.");
    }
  }, [isListening]);

  return {
    error,
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
}
