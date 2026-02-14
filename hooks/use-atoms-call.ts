"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { AtomsClient } from "atoms-client-sdk";

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

  const resetState = useCallback(() => {
    setStatus("idle");
    setStatusMessage("Ready");
    setIsAgentSpeaking(false);
    setIsMuted(false);
    setError(null);
  }, []);

  // Set up event listeners
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
    });

    client.on("agent_start_talking", () => {
      setIsAgentSpeaking(true);
      setStatusMessage("Dispatcher speaking...");
    });

    client.on("agent_stop_talking", () => {
      setIsAgentSpeaking(false);
      setStatusMessage("Listening...");
    });

    client.on("transcript", (data: { text: string }) => {
      addTranscript("dispatcher", data.text);
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
    try {
      client.stopSession();
    } catch {
      // Session may already be stopped
    }
    resetState();
  }, [client, resetState]);

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
    startCall,
    endCall,
    toggleMute,
    error,
  };
}
