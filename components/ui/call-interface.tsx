"use client";

import { useAtomsCall, type CallStatus } from "@/hooks/use-atoms-call";
import { useEffect, useRef } from "react";

function StatusIndicator({ status }: { status: CallStatus }) {
  const config: Record<CallStatus, { color: string; pulse: boolean; label: string }> = {
    idle: { color: "bg-gray-300", pulse: false, label: "Standby" },
    connecting: { color: "bg-amber-400", pulse: true, label: "Connecting" },
    waiting_for_agent: { color: "bg-amber-400", pulse: true, label: "Routing" },
    active: { color: "bg-emerald-500", pulse: true, label: "Active" },
    error: { color: "bg-red-500", pulse: false, label: "Error" },
    ended: { color: "bg-gray-300", pulse: false, label: "Ended" },
  };

  const { color, pulse, label } = config[status];

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`}
        />
      </span>
      <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </span>
    </div>
  );
}

function WaveformVisualizer({ active }: { active: boolean }) {
  const bars = Array.from({ length: 24 }).map((_, i) => ({
    height: `${12 + ((i * 17) % 44)}px`,
    duration: `${320 + ((i * 53) % 390)}ms`,
    delay: `${i * 50}ms`,
  }));

  return (
    <div className="flex items-center justify-center gap-[3px] h-16">
      {bars.map((bar, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all duration-200 ${
            active
              ? "bg-emerald-500/70 animate-pulse"
              : "bg-gray-200 h-1.5"
          }`}
          style={
            active
              ? {
                  height: bar.height,
                  animationDelay: bar.delay,
                  animationDuration: bar.duration,
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
    interimTranscript,
    startCall,
    endCall,
    toggleMute,
    error,
  } = useAtomsCall();

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const isCallActive = status === "active" || status === "waiting_for_agent";
  const isConnecting = status === "connecting";

  return (
    <div className="grid w-full min-w-0 gap-4 md:gap-6 xl:grid-cols-[1.6fr_minmax(20rem,1fr)]">
      {/* Main Card */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-100 px-4 py-4 text-center md:px-6 md:py-5">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            911
          </h1>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.25em] text-gray-400">
            Emergency Dispatch
          </p>
        </div>

        <div className="space-y-6 p-5 md:p-6">
          {/* Status row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusIndicator status={status} />
            <span className="font-mono text-[11px] text-gray-400">
              {statusMessage}
            </span>
          </div>

          {/* Waveform area */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            {isCallActive || isConnecting ? (
              <WaveformVisualizer active={isAgentSpeaking} />
            ) : (
              <div className="flex h-16 items-center justify-center">
                <p className="text-sm text-gray-400">
                  {status === "idle"
                    ? "Press the button below to call"
                    : status === "ended"
                    ? "Call has ended"
                    : "An error occurred"}
                </p>
              </div>
            )}
          </div>

          {/* Error (semantic red — not theme) */}
          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50/80 px-3 py-2.5">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-4 pb-1">
            {!isCallActive && !isConnecting ? (
              <div className="flex flex-col items-center gap-2.5">
                <button
                  onClick={startCall}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-105 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95 sm:h-[4.5rem] sm:w-[4.5rem]"
                >
                  <svg
                    className="h-7 w-7 sm:h-8 sm:w-8"
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
                </button>
                <span className="text-[11px] font-medium text-gray-400">Call 911</span>
              </div>
            ) : (
              <>
                {/* Mute — neutral button */}
                <button
                  onClick={toggleMute}
                  disabled={status !== "active"}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all ${
                    isMuted
                      ? "border-amber-300 bg-amber-50 text-amber-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
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

                {/* End call — semantic red */}
                <button
                  onClick={endCall}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-md shadow-red-500/15 transition-all hover:scale-105 hover:bg-red-400 active:scale-95"
                >
                  <svg className="h-5 w-5 rotate-135" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
      </section>

      {/* Transcript panel */}
      <aside className="flex min-w-0 w-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2">
            {(isCallActive || isConnecting) && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
            )}
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              Live Transcript
            </h2>
          </div>
          {transcript.length > 0 && (
            <span className="text-[10px] tabular-nums text-gray-400">
              {transcript.length} message{transcript.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="min-h-[18rem] w-full flex-1 min-w-0 rounded-lg bg-gray-50/70 p-3 sm:min-h-[20rem]">
          {(transcript.length > 0 || interimTranscript) ? (
            <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin">
              <div className="space-y-3">
                {transcript.map((msg) => (
                  <div key={msg.id} className="flex min-w-0 gap-3">
                    <span
                      className={`mt-0.5 shrink-0 text-[10px] font-bold uppercase tracking-wider ${
                        msg.sender === "dispatcher"
                          ? "text-emerald-600"
                          : "text-gray-500"
                      }`}
                    >
                      {msg.sender === "dispatcher" ? "DISP" : "YOU"}
                    </span>
                    <p className="min-w-0 flex-1 break-words text-sm leading-relaxed text-gray-700">
                      {msg.text}
                    </p>
                  </div>
                ))}
                {interimTranscript ? (
                  <div className="flex min-w-0 gap-3">
                    <span className="mt-0.5 shrink-0 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      YOU
                    </span>
                    <p className="min-w-0 flex-1 break-words text-sm leading-relaxed text-gray-400 italic">
                      {interimTranscript}
                    </p>
                  </div>
                ) : null}
              </div>
              <div ref={transcriptEndRef} />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-400">
                Transcript will appear here once the call starts.
              </p>
            </div>
          )}
        </div>
      </aside>

      <p className="text-center text-[11px] text-gray-400 xl:col-span-2">
        This is a simulation. For real emergencies, call your local 911.
      </p>
    </div>
  );
}
