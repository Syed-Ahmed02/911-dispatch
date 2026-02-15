"use client";

import { useEffect, useState } from "react";
import type { DispatchCall } from "@/components/dispatcher/types";
import type { StoredTriageEntry } from "@/app/api/triage/store";

const POLL_INTERVAL_MS = 3000;
const DEFAULT_LAT = 43.4712;
const DEFAULT_LNG = -80.5324;

function mapCategory(category: string | undefined): "Medical" | "Fire" | "Police" {
  const c = (category ?? "").toUpperCase();
  if (c === "EMS") return "Medical";
  if (c === "FIRE") return "Fire";
  if (c === "POLICE") return "Police";
  return "Medical";
}

function mapUrgency(urgency: string | undefined): "P1" | "P2" | "P3" | "P4" {
  const u = (urgency ?? "").toUpperCase();
  if (u === "HIGH") return "P1";
  if (u === "MEDIUM") return "P2";
  if (u === "LOW") return "P3";
  return "P3";
}

function triageEntryToDispatchCall(entry: StoredTriageEntry): DispatchCall {
  const at = new Date(entry.at).getTime();
  const state = entry.state;
  return {
    id: entry.callId,
    phoneNumber: (state.callback_number ?? entry.userNumber ?? "—") as string,
    callerName: "Caller",
    locationText: (state.location_raw ?? "—") as string,
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    emergencyType: mapCategory(state.category as string),
    priority: mapUrgency(state.urgency as string),
    status: "ongoing",
    startedAt: at,
    tags: Array.isArray(state.red_flags) ? (state.red_flags as string[]) : [],
    urgencyScore: (state.urgency === "HIGH" && 90) || (state.urgency === "MEDIUM" && 70) || 50,
    confidence: 0.9,
    transcript: [],
    notes: (state.one_sentence_summary ?? "") as string,
  };
}

export function useLiveTriageCalls(): DispatchCall[] {
  const [calls, setCalls] = useState<DispatchCall[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchCalls = async () => {
      try {
        const res = await fetch("/api/triage/calls");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const entries: StoredTriageEntry[] = data.calls ?? [];
        if (cancelled) return;
        setCalls(entries.map(triageEntryToDispatchCall));
      } catch {
        // ignore
      }
    };

    fetchCalls();
    const interval = setInterval(fetchCalls, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return calls;
}
