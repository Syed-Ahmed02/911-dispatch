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

export interface TriageState {
  location_raw?: string;
  location_confirmed?: boolean;
  callback_number?: string;
  is_emergency?: boolean;
  category?: string;
  urgency?: string;
  suggested_units?: { police?: boolean; fire?: boolean; ems?: boolean };
  red_flags?: string[];
  one_sentence_summary?: string;
  last_caller_message?: string;
  last_assistant_message?: string;
  [key: string]: unknown;
}

export interface UseAtomsCallReturn {
  status: CallStatus;
  statusMessage: string;
  isAgentSpeaking: boolean;
  isMuted: boolean;
  transcript: TranscriptMessage[];
  triageState: TriageState | null;
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
  const [triageState, setTriageState] = useState<TriageState | null>(null);
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
    // Keep triageState so UI can still show last extraction after call ends
  }, []);

  const pushTriageToServer = useCallback((state: TriageState) => {
    fetch("/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triage_state: state }),
    }).catch((err) => console.warn("[triage] Failed to store on server:", err));
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

    client.on("update", (data: Record<string, unknown>) => {
      const triage = extractTriageFromUpdate(data);
      if (triage) {
        setTriageState(triage);
        pushTriageToServer(triage);
      }
    });

    client.on("metadata", (data: Record<string, unknown>) => {
      const triage = extractTriageFromUpdate(data);
      if (triage) {
        setTriageState(triage);
        pushTriageToServer(triage);
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
  }, [client, addTranscript, pushTriageToServer]);

  const startCall = useCallback(async () => {
    try {
      setError(null);
      setTranscript([]);
      setTriageState(null);
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
    triageState,
    startCall,
    endCall,
    toggleMute,
    error,
  };
}

function extractTriageFromUpdate(data: Record<string, unknown>): TriageState | null {
  if (!data || typeof data !== "object") return null;
  const raw =
    data.triage_state ??
    data.triageState ??
    data.triage_raw ??
    (typeof data.triage === "string" ? data.triage : null);
  if (raw == null) {
    if (
      typeof data.location_raw === "string" ||
      typeof data.category === "string" ||
      data.is_emergency !== undefined
    ) {
      return data as TriageState;
    }
    return null;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as TriageState;
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
  return (raw as TriageState) && typeof raw === "object" ? (raw as TriageState) : null;
}
