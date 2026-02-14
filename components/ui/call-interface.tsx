"use client";

import { useAtomsCall, type CallStatus } from "@/hooks/use-atoms-call";
import { useEffect, useRef } from "react";

/* ─── Design System ───
 * Aesthetic: Dark, utilitarian dispatch terminal
 * Typography: Geist Sans (headings) + Geist Mono (data/timestamps)
 * Palette: Neutral-950 base, red-600 primary (emergency), blue-500 caller accent
 * Motion: Purposeful — waveform bars, message fade-in, breathing CTA glow
 * Layout: Single-column, centered, max-w-sm for focused attention
 * ─── */

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/* ─── Status Indicator ─── */
function StatusIndicator({ status }: { status: CallStatus }) {
  const config: Record<
    CallStatus,
    { color: string; pulse: boolean; label: string }
  > = {
    idle: { color: "bg-neutral-500", pulse: false, label: "Standby" },
    connecting: { color: "bg-amber-400", pulse: true, label: "Connecting" },
    waiting_for_agent: {
      color: "bg-amber-400",
      pulse: true,
      label: "Routing",
    },
    active: { color: "bg-emerald-400", pulse: true, label: "Active" },
    error: { color: "bg-red-500", pulse: false, label: "Error" },
    ended: { color: "bg-neutral-500", pulse: false, label: "Ended" },
  };

  const { color, pulse, label } = config[status];

  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-2.5 w-2.5">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ring-expand ${color}`}
          />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`}
        />
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400 font-mono">
        {label}
      </span>
    </div>
  );
}

/* ─── Waveform Visualizer ─── */
function WaveformVisualizer({ active }: { active: boolean }) {
  const barCount = 28;

  return (
    <div
      className="flex items-center justify-center gap-[3px] h-14"
      role="img"
      aria-label={active ? "Dispatcher is speaking" : "Waiting for audio"}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        // Create a natural wave shape: taller in the center, shorter at edges
        const center = (barCount - 1) / 2;
        const dist = Math.abs(i - center) / center; // 0 at center, 1 at edges
        const maxH = active ? 40 - dist * 26 : 4;
        const minH = active ? 6 : 4;

        return (
          <div
            key={i}
            className={`w-[3px] rounded-full origin-center transition-colors duration-200 ${
              active
                ? "bg-red-500 animate-waveform-bar"
                : "bg-neutral-700/60"
            }`}
            style={{
              height: active ? undefined : `${minH}px`,
              minHeight: `${minH}px`,
              maxHeight: `${maxH}px`,
              animationDuration: active
                ? `${600 + Math.sin(i * 0.7) * 250}ms`
                : undefined,
              animationDelay: active ? `${i * 35}ms` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Sender Badge ─── */
function SenderBadge({ sender }: { sender: "caller" | "dispatcher" }) {
  const isDispatcher = sender === "dispatcher";
  return (
    <span
      className={`inline-flex items-center rounded-sm px-1.5 py-px text-[10px] font-bold uppercase tracking-[0.1em] font-mono leading-none ${
        isDispatcher
          ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/20"
          : "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20"
      }`}
    >
      {isDispatcher ? "DISP" : "YOU"}
    </span>
  );
}

/* ─── Phone Icon ─── */
function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

/* ─── Main Interface ─── */
export function CallInterface() {
  const {
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
  } = useAtomsCall();

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, interimTranscript]);

  const isCallActive = status === "active" || status === "waiting_for_agent";
  const isConnecting = status === "connecting";
  const showTranscript = transcript.length > 0 || interimTranscript;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-950 p-4 selection:bg-red-500/30">
      <div className="w-full max-w-sm space-y-5">
        {/* ── Header ── */}
        <header className="text-center space-y-1">
          <h1 className="text-5xl font-black tracking-tight text-white leading-none">
            911
          </h1>
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-neutral-500">
            Emergency Dispatch
          </p>
        </header>

        {/* ── Main Card ── */}
        <section className="rounded-2xl border border-neutral-800/80 bg-neutral-900/80 backdrop-blur-sm p-5 shadow-2xl shadow-black/40">
          {/* Status Bar */}
          <div className="flex items-center justify-between mb-5">
            <StatusIndicator status={status} />
            <span className="text-[11px] text-neutral-500 font-mono tracking-wide">
              {statusMessage}
            </span>
          </div>

          {/* Waveform / Visual */}
          <div className="mb-5 rounded-xl border border-neutral-800/60 bg-neutral-950/80 p-4">
            {isCallActive || isConnecting ? (
              <WaveformVisualizer active={isAgentSpeaking} />
            ) : (
              <div className="flex h-14 items-center justify-center">
                <p className="text-sm text-neutral-600 font-light">
                  {status === "idle"
                    ? "Press the button below to call"
                    : status === "ended"
                      ? "Call has ended"
                      : "An error occurred"}
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-900/40 bg-red-950/30 px-3.5 py-2.5">
              <p className="text-xs text-red-400 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Speech Recognition Warning */}
          {isCallActive && !isSpeechRecognitionSupported && (
            <div className="mb-4 rounded-lg border border-amber-900/40 bg-amber-950/20 px-3.5 py-2.5">
              <p className="text-[11px] text-amber-400/80 leading-relaxed">
                Your browser does not support speech recognition. Caller
                messages will not appear in the transcript. Use Chrome or Edge
                for full support.
              </p>
            </div>
          )}

          {/* ── Call Controls ── */}
          <div className="flex items-center justify-center gap-5 pt-1">
            {!isCallActive && !isConnecting ? (
              /* Call Button */
              <button
                onClick={startCall}
                className="group relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-red-600 text-white transition-all duration-300 hover:bg-red-500 hover:scale-105 active:scale-95 animate-glow-breathe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                aria-label="Start emergency call"
              >
                <PhoneIcon className="h-7 w-7" />
                <span className="absolute -bottom-7 text-[11px] font-medium text-neutral-500 group-hover:text-red-400 transition-colors">
                  Call 911
                </span>
              </button>
            ) : (
              <>
                {/* Mute */}
                <button
                  onClick={toggleMute}
                  disabled={status !== "active"}
                  aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 ${
                    isMuted
                      ? "border-amber-600/60 bg-amber-600/15 text-amber-400"
                      : "border-neutral-700/60 bg-neutral-800/60 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  {isMuted ? (
                    <svg
                      className="h-[18px] w-[18px]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-[18px] w-[18px]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  )}
                </button>

                {/* End Call */}
                <button
                  onClick={endCall}
                  aria-label="End call"
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-900/40 transition-all duration-200 hover:bg-red-500 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
                >
                  <PhoneIcon className="h-5 w-5 rotate-[135deg]" />
                </button>
              </>
            )}
          </div>
        </section>

        {/* ── Live Transcript ── */}
        {showTranscript && (
          <section
            className="rounded-2xl border border-neutral-800/80 bg-neutral-900/80 backdrop-blur-sm shadow-2xl shadow-black/30 overflow-hidden"
            aria-label="Live call transcript"
          >
            {/* Transcript Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/60">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                  Live Transcript
                </h2>
              </div>
              <span className="text-[10px] font-mono text-neutral-600 tabular-nums">
                {transcript.length}{" "}
                {transcript.length === 1 ? "msg" : "msgs"}
              </span>
            </div>

            {/* Messages */}
            <div className="max-h-80 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-dispatch">
              {transcript.map((msg, index) => {
                const isDispatcher = msg.sender === "dispatcher";

                return (
                  <div
                    key={msg.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(index * 20, 100)}ms` }}
                  >
                    <div
                      className={`group relative rounded-lg px-3 py-2.5 transition-colors duration-150 ${
                        isDispatcher
                          ? "border-l-2 border-red-500/50 bg-red-950/15 hover:bg-red-950/25"
                          : "border-l-2 border-blue-500/50 bg-blue-950/15 hover:bg-blue-950/25"
                      }`}
                    >
                      {/* Top row: badge + timestamp */}
                      <div className="flex items-center justify-between mb-1.5">
                        <SenderBadge sender={msg.sender} />
                        <span className="text-[10px] font-mono text-neutral-600 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      {/* Message text */}
                      <p
                        className={`text-[13px] leading-relaxed ${
                          isDispatcher
                            ? "text-neutral-200"
                            : "text-neutral-300"
                        }`}
                      >
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Interim transcript — the caller's in-progress speech */}
              {interimTranscript && (
                <div className="animate-fade-in-up">
                  <div className="rounded-lg border-l-2 border-blue-500/25 bg-blue-950/8 px-3 py-2.5">
                    <div className="flex items-center mb-1.5">
                      <span className="inline-flex items-center rounded-sm px-1.5 py-px text-[10px] font-bold uppercase tracking-[0.1em] font-mono leading-none bg-blue-500/8 text-blue-400/50 ring-1 ring-blue-500/10">
                        YOU
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-neutral-500 italic">
                      {interimTranscript}
                      <span className="ml-1 inline-block h-3.5 w-[2px] bg-blue-400/50 animate-cursor-blink" />
                    </p>
                  </div>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>
          </section>
        )}

        {/* ── Footer ── */}
        <footer>
          <p className="text-center text-[11px] text-neutral-600 leading-relaxed">
            This is a simulation. For real emergencies, call your local 911.
          </p>
        </footer>
      </div>
    </div>
  );
}
