"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Extend Window to include vendor-prefixed SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;

  const SR =
    (window as unknown as Record<string, unknown>).SpeechRecognition ??
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

  return (SR as SpeechRecognitionConstructor) ?? null;
}

export interface UseSpeechRecognitionReturn {
  /** Whether the browser supports the Web Speech API */
  isSupported: boolean;
  /** Whether recognition is currently active */
  isListening: boolean;
  /** The current interim (partial) transcript being spoken */
  interimTranscript: string;
  /** Start listening for speech */
  start: () => void;
  /** Stop listening for speech */
  stop: () => void;
  /**
   * Suppress results while the agent/dispatcher is speaking.
   * When true, interim and final results are silently discarded so that
   * audio bleed-through from speakers is not attributed to the caller.
   */
  setSuppressed: (suppressed: boolean) => void;
}

interface UseSpeechRecognitionOptions {
  /** Called when a final transcript segment is produced */
  onResult: (text: string) => void;
  /** Language for recognition (default: "en-US") */
  lang?: string;
}

export function useSpeechRecognition({
  onResult,
  lang = "en-US",
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldBeListeningRef = useRef(false);
  const suppressedRef = useRef(false);
  const onResultRef = useRef(onResult);

  // Keep callback ref up to date without triggering re-renders
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const isSupported = typeof window !== "undefined" && getSpeechRecognition() !== null;

  const start = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    // Stop any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Discard results while suppressed (agent is speaking — mic picks up speaker audio)
      if (suppressedRef.current) {
        setInterimTranscript("");
        return;
      }

      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          const trimmed = text.trim();
          if (trimmed) {
            onResultRef.current(trimmed);
          }
        } else {
          interim += text;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" and "aborted" are normal during a call — don't stop
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }
      console.warn("SpeechRecognition error:", event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      // Auto-restart if we should still be listening (recognition times out)
      if (shouldBeListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // May fail if already started; ignore
        }
      }
    };

    recognitionRef.current = recognition;
    shouldBeListeningRef.current = true;

    try {
      recognition.start();
    } catch {
      // May throw if already started
    }
  }, [lang]);

  const stop = useCallback(() => {
    shouldBeListeningRef.current = false;
    setInterimTranscript("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const setSuppressed = useCallback((suppressed: boolean) => {
    suppressedRef.current = suppressed;
    if (suppressed) {
      setInterimTranscript("");
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldBeListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    start,
    stop,
    setSuppressed,
  };
}
