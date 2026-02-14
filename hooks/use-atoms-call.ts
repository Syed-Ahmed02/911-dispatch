"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { AtomsClient } from "atoms-client-sdk";
import { useSpeechRecognition } from "./use-speech-recognition";

export type CallStatus =
  | "idle"
  | "connecting"
  | "waiting_for_agent"
  | "active"
  | "error"
  | "ended";

export interface TranscriptMessage {
  id: number;
  sender: "caller" | "dispatcher";
  text: string;
  timestamp: number;
}

export interface UseAtomsCallReturn {
  status: CallStatus;
  statusMessage: string;
  isAgentSpeaking: boolean;
  isMuted: boolean;
  transcript: TranscriptMessage[];
  /** The caller's in-progress speech (not yet finalized) */
  interimTranscript: string;
  /** Whether the Web Speech API is supported in this browser */
  isSpeechRecognitionSupported: boolean;
  startCall: () => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  error: string | null;
}

export function useAtomsCall(): UseAtomsCallReturn {
  const client = useMemo(() => new AtomsClient(), []);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messageIdRef = useRef(0);

  const addTranscript = useCallback(
    (sender: "caller" | "dispatcher", text: string) => {
      messageIdRef.current += 1;
      setTranscript((prev) => [
        ...prev,
        {
          id: messageIdRef.current,
          sender,
          text,
          timestamp: Date.now(),
        },
      ]);
    },
    []
  );

  // Speech recognition for capturing caller's spoken words
  const {
    isSupported: isSpeechRecognitionSupported,
    interimTranscript,
    start: startSpeechRecognition,
    stop: stopSpeechRecognition,
    setSuppressed: setSpeechSuppressed,
  } = useSpeechRecognition({
    onResult: (text) => {
      addTranscript("caller", text);
    },
  });

  // Refs for speech recognition functions so the Atoms event-listener
  // useEffect doesn't depend on them (avoids tearing down listeners on
  // every callback identity change).
  const startSpeechRef = useRef(startSpeechRecognition);
  const setSuppressedRef = useRef(setSpeechSuppressed);
  useEffect(() => {
    startSpeechRef.current = startSpeechRecognition;
  }, [startSpeechRecognition]);
  useEffect(() => {
    setSuppressedRef.current = setSpeechSuppressed;
  }, [setSpeechSuppressed]);

  const resetState = useCallback(() => {
    setStatus("idle");
    setStatusMessage("Ready");
    setIsAgentSpeaking(false);
    setIsMuted(false);
    setError(null);
  }, []);

  // Set up Atoms event listeners
  useEffect(() => {
    client.removeAllListeners();

    client.on("session_started", () => {
      setStatus("waiting_for_agent");
      setStatusMessage("Connecting to dispatcher...");
    });

    client.on("session_ended", () => {
      setStatus("ended");
      setStatusMessage("Call ended");
      setIsAgentSpeaking(false);
      setIsMuted(false);
    });

    client.on("agent_connected", () => {
      setStatus("active");
      setStatusMessage("Dispatcher connected");
      // Start speech recognition only after the WebRTC session is fully
      // established, so both the Atoms SDK and Web Speech API don't race
      // for microphone access during connection setup.
      startSpeechRef.current();
    });

    client.on("agent_start_talking", () => {
      setIsAgentSpeaking(true);
      setStatusMessage("Dispatcher speaking...");
      // Suppress speech recognition so mic bleed-through from speakers
      // is not transcribed as caller speech
      setSuppressedRef.current(true);
    });

    client.on("agent_stop_talking", () => {
      setIsAgentSpeaking(false);
      setStatusMessage("Listening...");
      setSuppressedRef.current(false);
    });

    client.on(
      "transcript",
      (data: { text?: string; topic?: string; type?: string }) => {
        // The atoms-client-sdk hardcodes topic to "agent_response" for all
        // transcript events received via the data channel.
        const text = data.text?.trim();
        if (text) {
          addTranscript("dispatcher", text);
        }
      }
    );

    // Some Atoms server versions send agent text via the "update" event
    // instead of (or in addition to) "transcript".
    client.on("update", (data: Record<string, unknown>) => {
      if (typeof data.text === "string" && data.text.trim()) {
        addTranscript("dispatcher", data.text.trim());
      }
    });

    client.on("microphone_permission_granted", () => {
      // Mic access OK
    });

    client.on(
      "microphone_permission_error",
      (data: { error: string }) => {
        setError(`Microphone error: ${data.error}`);
        setStatus("error");
        setStatusMessage("Microphone access denied");
      }
    );

    client.on("microphone_access_failed", (data: { error: string }) => {
      setError(`Microphone access failed: ${data.error}`);
      setStatus("error");
      setStatusMessage("Microphone access failed");
    });

    client.on("error", (err: string) => {
      setError(String(err));
      setStatus("error");
      setStatusMessage("Connection error");
    });

    return () => {
      client.removeAllListeners();
    };
  }, [client, addTranscript]);

  const startCall = useCallback(async () => {
    try {
      setError(null);
      setTranscript([]);
      setStatus("connecting");
      setStatusMessage("Initiating call...");

      // Get token from our API route
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to initiate call");
      }

      const { token, host } = await res.json();

      setStatusMessage("Connecting to dispatcher...");

      await client.startSession({
        accessToken: token,
        mode: "webcall",
        host,
      });

      await client.startAudioPlayback();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStatus("error");
      setStatusMessage("Failed to connect");
    }
  }, [client]);

  const endCall = useCallback(() => {
    stopSpeechRecognition();
    try {
      client.stopSession();
    } catch {
      // Session may already be stopped
    }
    resetState();
  }, [client, resetState, stopSpeechRecognition]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      client.unmute();
      setIsMuted(false);
    } else {
      client.mute();
      setIsMuted(true);
    }
  }, [client, isMuted]);

  return {
    status,
    statusMessage,
    isAgentSpeaking,
    isMuted,
    transcript,
    interimTranscript,
    isSpeechRecognitionSupported,
    startCall,
    endCall,
    toggleMute,
    error,
  };
}
