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
  const [triageState, setTriageState] = useState<TriageState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messageIdRef = useRef(0);
  const callIdRef = useRef<string | null>(null);
  const lastAddedCallerRef = useRef<string>("");
  const lastAddedAssistantRef = useRef<string>("");

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
    onResult: () => {
      // Live transcript is driven only by triage JSON (last_caller_message / last_assistant_message)
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
    callIdRef.current = null;
    lastAddedCallerRef.current = "";
    lastAddedAssistantRef.current = "";
    // Keep triageState so UI can still show last extraction after call ends
  }, []);

  const pushTriageToServer = useCallback((state: TriageState) => {
    const body: { triage_state: TriageState; call_id?: string } = { triage_state: state };
    if (callIdRef.current) body.call_id = callIdRef.current;
    fetch("/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch((err) => console.warn("[triage] Failed to store on server:", err));
    if (typeof window !== "undefined") {
      try {
        const key = "triageCalls";
        const raw = window.localStorage.getItem(key);
        const entries: { callId: string; state: TriageState; at: string }[] = raw ? JSON.parse(raw) : [];
        const callId = callIdRef.current ?? `legacy-${Date.now()}`;
        const at = new Date().toISOString();
        const existing = entries.findIndex((e) => e.callId === callId);
        const newEntry = { callId, state: { ...state, _at: at }, at };
        const next = existing >= 0 ? entries.map((e, i) => (i === existing ? newEntry : e)) : [...entries, newEntry].slice(-50);
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore
      }
    }
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

    const updateTranscriptFromTriage = (triage: TriageState) => {
      const callerMsg = typeof triage.last_caller_message === "string" ? triage.last_caller_message.trim() : "";
      const assistantMsg = typeof triage.last_assistant_message === "string" ? triage.last_assistant_message.trim() : "";
      if (callerMsg && callerMsg !== lastAddedCallerRef.current) {
        lastAddedCallerRef.current = callerMsg;
        addTranscript("caller", callerMsg);
      }
      if (assistantMsg && assistantMsg !== lastAddedAssistantRef.current) {
        lastAddedAssistantRef.current = assistantMsg;
        addTranscript("dispatcher", assistantMsg);
      }
    };

    client.on("update", (data: Record<string, unknown>) => {
      console.log("[Atoms] update event", data);
      const triage = extractTriageFromUpdate(data);
      if (triage) {
        console.log("[Atoms] triage extracted from update", triage);
        setTriageState(triage);
        pushTriageToServer(triage);
        updateTranscriptFromTriage(triage);
      }
    });

    client.on("metadata", (data: Record<string, unknown>) => {
      console.log("[Atoms] metadata event", data);
      const triage = extractTriageFromUpdate(data);
      if (triage) {
        console.log("[Atoms] triage extracted from metadata", triage);
        setTriageState(triage);
        pushTriageToServer(triage);
        updateTranscriptFromTriage(triage);
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

      const data = await res.json();
      const { token, host, callId } = data;
      callIdRef.current = callId ?? null;

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
    triageState,
    interimTranscript,
    isSpeechRecognitionSupported,
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
