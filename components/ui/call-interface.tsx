"use client";

import { useAtomsCall, type CallStatus, type TriageState } from "@/hooks/use-atoms-call";
import { useEffect, useRef, useState } from "react";

function StatusIndicator({ status }: { status: CallStatus }) {
  const config: Record<CallStatus, { color: string; pulse: boolean; label: string }> = {
    idle: { color: "bg-gray-400", pulse: false, label: "Standby" },
    connecting: { color: "bg-yellow-400", pulse: true, label: "Connecting" },
    waiting_for_agent: { color: "bg-yellow-400", pulse: true, label: "Routing" },
    active: { color: "bg-green-500", pulse: true, label: "Active" },
    error: { color: "bg-red-500", pulse: false, label: "Error" },
    ended: { color: "bg-gray-400", pulse: false, label: "Ended" },
  };

  const { color, pulse, label } = config[status];

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-3 w-3">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex h-3 w-3 rounded-full ${color}`}
        />
      </span>
      <span className="text-sm font-medium uppercase tracking-wider text-neutral-400">
        {label}
      </span>
    </div>
  );
}

function WaveformVisualizer({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-150 ${
            active
              ? "bg-red-500/80 animate-pulse"
              : "bg-neutral-700 h-2"
          }`}
          style={
            active
              ? {
                  height: `${Math.random() * 48 + 8}px`,
                  animationDelay: `${i * 50}ms`,
                  animationDuration: `${300 + Math.random() * 400}ms`,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

export function CallInterface() {
  const {
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
  } = useAtomsCall();
  const [serverTriage, setServerTriage] = useState<TriageState | null>(null);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const displayTriage = triageState ?? serverTriage;
  const fetchLatestTriage = () => {
    fetch("/api/triage")
      .then((r) => r.json())
      .then((d) => d.triage && setServerTriage(d.triage))
      .catch(() => {});
  };

  const isCallActive = status === "active" || status === "waiting_for_agent";
  const isConnecting = status === "connecting";

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tight text-white">
            911
          </h1>
          <p className="mt-1 text-sm font-medium uppercase tracking-[0.3em] text-neutral-500">
            Emergency Dispatch
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl shadow-red-950/10">
          {/* Status Bar */}
          <div className="flex items-center justify-between mb-6">
            <StatusIndicator status={status} />
            <span className="text-xs text-neutral-500 font-mono">
              {statusMessage}
            </span>
          </div>

          {/* Waveform / Visual */}
          <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            {isCallActive || isConnecting ? (
              <WaveformVisualizer active={isAgentSpeaking} />
            ) : (
              <div className="flex h-16 items-center justify-center">
                <p className="text-sm text-neutral-600">
                  {status === "idle"
                    ? "Press the button below to call"
                    : status === "ended"
                    ? "Call has ended"
                    : "An error occurred"}
                </p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isCallActive && !isConnecting ? (
              <button
                onClick={startCall}
                className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-500 hover:shadow-red-500/40 hover:scale-105 active:scale-95"
              >
                {/* Phone icon */}
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="absolute -bottom-7 text-xs font-medium text-neutral-400 group-hover:text-red-400">
                  Call 911
                </span>
              </button>
            ) : (
              <>
                {/* Mute Button */}
                <button
                  onClick={toggleMute}
                  disabled={status !== "active"}
                  className={`flex h-14 w-14 items-center justify-center rounded-full border transition-all ${
                    isMuted
                      ? "border-yellow-600 bg-yellow-600/20 text-yellow-400"
                      : "border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600 hover:text-white"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {isMuted ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>

                {/* End Call Button */}
                <button
                  onClick={endCall}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-500 hover:scale-105 active:scale-95"
                >
                  <svg className="h-6 w-6 rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Triage extraction (JSON) */}
        {(displayTriage || status !== "idle") && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Triage state (extracted JSON)
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={fetchLatestTriage}
                  className="rounded bg-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-600"
                >
                  Refresh from server
                </button>
                {displayTriage && (
                  <a
                    href={`data:application/json;charset=utf-8,${encodeURIComponent(
                      JSON.stringify(displayTriage, null, 2)
                    )}`}
                    download="triage-state.json"
                    className="rounded bg-red-600/80 px-2 py-1 text-xs text-white hover:bg-red-500"
                  >
                    Download JSON
                  </a>
                )}
              </div>
            </div>
            {displayTriage ? (
              <pre className="max-h-64 overflow-auto rounded bg-neutral-950 p-3 text-xs text-neutral-400">
                {JSON.stringify(displayTriage, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-neutral-600">
                No triage state yet. It will appear when the agent calls triage_update, or after a
                webhook. Use “Refresh from server” after a call if you use the webhook.
              </p>
            )}
          </div>
        )}

        {/* Live Transcript */}
        {transcript.length > 0 && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Live Transcript
              </h2>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {transcript.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <span
                    className={`mt-0.5 shrink-0 text-xs font-bold uppercase tracking-wider ${
                      msg.sender === "dispatcher"
                        ? "text-red-400"
                        : "text-blue-400"
                    }`}
                  >
                    {msg.sender === "dispatcher" ? "DISP" : "YOU"}
                  </span>
                  <p className="text-sm leading-relaxed text-neutral-300">
                    {msg.text}
                  </p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-neutral-600">
          This is a simulation.
        </p>
      </div>
    </div>
  );
}
