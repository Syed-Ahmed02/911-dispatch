"use client";

import { useEffect, useState } from "react";
import type { DispatchCall } from "@/components/dispatcher/types";
import type { StoredTriageEntry } from "@/app/api/triage/store";

const POLL_INTERVAL_MS = 2000;
const DEFAULT_LAT = 43.4712;
const DEFAULT_LNG = -80.5324;
const LOCAL_STORAGE_KEY = "triageCalls";

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

function getLocalTriageEntries(): StoredTriageEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { callId: string; state: StoredTriageEntry["state"]; at: string }[];
    return Array.isArray(parsed)
      ? parsed.map((e) => ({ callId: e.callId, state: e.state, at: e.at }))
      : [];
  } catch {
    return [];
  }
}

function mergeTriageEntries(apiEntries: StoredTriageEntry[], localEntries: StoredTriageEntry[]): StoredTriageEntry[] {
  const byCallId = new Map<string, StoredTriageEntry>();
  for (const e of apiEntries) byCallId.set(e.callId, e);
  for (const e of localEntries) {
    const existing = byCallId.get(e.callId);
    if (!existing || new Date(e.at) > new Date(existing.at)) byCallId.set(e.callId, e);
  }
  return Array.from(byCallId.values()).sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}

export function useLiveTriageCalls(): DispatchCall[] {
  const [calls, setCalls] = useState<DispatchCall[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchCalls = async () => {
      try {
        const res = await fetch("/api/triage/calls");
        const apiEntries: StoredTriageEntry[] = res.ok ? ((await res.json()).calls ?? []) : [];
        const localEntries = getLocalTriageEntries();
        const merged = mergeTriageEntries(apiEntries, localEntries);
        if (cancelled) return;
        setCalls(merged.map(triageEntryToDispatchCall));
      } catch {
        if (!cancelled) setCalls(getLocalTriageEntries().map((e) => triageEntryToDispatchCall(e)));
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
