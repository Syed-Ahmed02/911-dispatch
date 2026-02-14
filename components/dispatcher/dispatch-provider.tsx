"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { INITIAL_CALLS, priorityWeight, randomLiveLine } from "./mock-data";
import type { CallStatus, DispatchCall, EmergencyType, TranscriptLine } from "./types";

interface DashboardMetrics {
  totalCallsToday: number;
  ongoingCalls: number;
  dispatchSent: number;
  resolvedCalls: number;
  avgTimeToDispatchMins: number;
  highPriorityCount: number;
}

interface CallsByType {
  Medical: number;
  Fire: number;
  Police: number;
}

interface HourlyPoint {
  hour: string;
  count: number;
}

interface DispatchContextValue {
  now: number;
  calls: DispatchCall[];
  selectedCallId: string | null;
  metrics: DashboardMetrics;
  callsByType: CallsByType;
  callsByHour: HourlyPoint[];
  selectCall: (callId: string) => void;
  updateCallStatus: (callId: string, status: CallStatus) => void;
  updateCallNotes: (callId: string, notes: string) => void;
}

const DispatchContext = createContext<DispatchContextValue | null>(null);

function buildHourlySeries(calls: DispatchCall[]): HourlyPoint[] {
  const buckets = new Map<number, number>();

  for (let i = 0; i < 8; i += 1) {
    buckets.set(i, 0);
  }

  calls.forEach((call) => {
    const hour = new Date(call.startedAt).getHours();
    buckets.set(hour, (buckets.get(hour) ?? 0) + 1);
  });

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(-8)
    .map(([hour, count]) => ({
      hour: `${String(hour).padStart(2, "0")}:00`,
      count,
    }));
}

function byType(calls: DispatchCall[], type: EmergencyType): number {
  return calls.filter((call) => call.emergencyType === type).length;
}

export function DispatchProvider({ children }: { children: ReactNode }) {
  const [calls, setCalls] = useState<DispatchCall[]>(INITIAL_CALLS);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(
    INITIAL_CALLS[0]?.id ?? null
  );
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCalls((current) => {
        const ongoing = current.filter((call) => call.status === "ongoing");
        if (ongoing.length === 0) {
          return current;
        }

        const selected = ongoing[Math.floor(Math.random() * ongoing.length)];

        return current.map((call) => {
          if (call.id !== selected.id) {
            return call;
          }

          const nextLine: TranscriptLine = {
            id: `t-${Date.now()}`,
            speaker: Math.random() > 0.6 ? "caller" : "dispatcher",
            text: randomLiveLine(),
            timestamp: Date.now(),
          };

          const nextTranscript = [
            ...call.transcript,
            nextLine,
          ];

          return {
            ...call,
            transcript: nextTranscript.slice(-12),
          };
        });
      });
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  const metrics = useMemo<DashboardMetrics>(() => {
    const totalCallsToday = calls.length;
    const ongoingCalls = calls.filter((call) => call.status === "ongoing").length;
    const dispatchSent = calls.filter((call) => call.status === "dispatch_sent").length;
    const resolvedCalls = calls.filter((call) => call.status === "resolved").length;

    const sentCalls = calls.filter((call) => call.dispatchSentAt && call.startedAt);
    const avgTimeToDispatchMins =
      sentCalls.length === 0
        ? 0
        : Math.round(
            sentCalls.reduce((acc, call) => {
              const delta = (call.dispatchSentAt ?? call.startedAt) - call.startedAt;
              return acc + delta / 60000;
            }, 0) / sentCalls.length
          );

    const highPriorityCount = calls.filter(
      (call) => call.priority === "P1" || call.priority === "P2"
    ).length;

    return {
      totalCallsToday,
      ongoingCalls,
      dispatchSent,
      resolvedCalls,
      avgTimeToDispatchMins,
      highPriorityCount,
    };
  }, [calls]);

  const callsByType = useMemo<CallsByType>(
    () => ({
      Medical: byType(calls, "Medical"),
      Fire: byType(calls, "Fire"),
      Police: byType(calls, "Police"),
    }),
    [calls]
  );

  const callsByHour = useMemo(() => buildHourlySeries(calls), [calls]);

  const selectCall = (callId: string) => {
    setSelectedCallId(callId);
  };

  const updateCallStatus = (callId: string, status: CallStatus) => {
    setCalls((current) =>
      current.map((call) => {
        if (call.id !== callId) {
          return call;
        }

        if (status === "dispatch_sent") {
          return {
            ...call,
            status,
            dispatchSentAt: call.dispatchSentAt ?? Date.now(),
          };
        }

        if (status === "resolved") {
          return {
            ...call,
            status,
            resolvedAt: Date.now(),
            dispatchSentAt: call.dispatchSentAt ?? Date.now(),
          };
        }

        return {
          ...call,
          status,
        };
      })
    );
  };

  const updateCallNotes = (callId: string, notes: string) => {
    setCalls((current) =>
      current.map((call) => {
        if (call.id !== callId) {
          return call;
        }

        return {
          ...call,
          notes,
        };
      })
    );
  };

  const value: DispatchContextValue = {
    now,
    calls,
    selectedCallId,
    metrics,
    callsByType,
    callsByHour,
    selectCall,
    updateCallStatus,
    updateCallNotes,
  };

  return <DispatchContext.Provider value={value}>{children}</DispatchContext.Provider>;
}

export function useDispatchData() {
  const value = useContext(DispatchContext);
  if (!value) {
    throw new Error("useDispatchData must be used inside DispatchProvider");
  }
  return value;
}

export function formatElapsed(startedAt: number, now: number): string {
  const total = Math.floor((now - startedAt) / 1000);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function statusLabel(status: CallStatus): string {
  if (status === "dispatch_sent") return "Dispatch Sent";
  if (status === "ongoing") return "Ongoing";
  return "Resolved";
}

export function priorityTone(priority: string): string {
  if (priority === "P1") return "bg-stone-200 text-stone-900 border-stone-400";
  if (priority === "P2") return "bg-stone-100 text-stone-800 border-stone-300";
  if (priority === "P3") return "bg-slate-100 text-slate-800 border-slate-300";
  if (priority === "P4") return "bg-slate-50 text-slate-700 border-slate-300";
  return "bg-slate-50 text-slate-600 border-slate-300";
}

export function statusTone(status: CallStatus): string {
  if (status === "ongoing") return "bg-stone-200 text-stone-900 border-stone-400";
  if (status === "dispatch_sent") {
    return "bg-slate-100 text-slate-800 border-slate-300";
  }
  return "bg-slate-50 text-slate-700 border-slate-300";
}

export function sortCalls(calls: DispatchCall[]): DispatchCall[] {
  return [...calls].sort((a, b) => {
    const statusRank: Record<CallStatus, number> = {
      ongoing: 0,
      dispatch_sent: 1,
      resolved: 2,
    };

    const statusDiff = statusRank[a.status] - statusRank[b.status];
    if (statusDiff !== 0) return statusDiff;

    const priorityDiff = priorityWeight(a.priority) - priorityWeight(b.priority);
    if (priorityDiff !== 0) return priorityDiff;

    return b.startedAt - a.startedAt;
  });
}
