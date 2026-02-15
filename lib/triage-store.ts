/**
 * In-memory store for triage_state received via webhook or other sources.
 * Keyed by callId. For production, replace with Redis/DB.
 */
export type TriageState = {
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
};

const store = new Map<string, { triage: TriageState; at: number }>();

const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export function setTriageForCall(callId: string, triage: TriageState): void {
  store.set(callId, { triage, at: Date.now() });
}

export function getTriageForCall(callId: string): TriageState | null {
  const entry = store.get(callId);
  if (!entry) return null;
  if (Date.now() - entry.at > MAX_AGE_MS) {
    store.delete(callId);
    return null;
  }
  return entry.triage;
}

/** Get the most recently stored triage (any call) for backwards compatibility */
export function getLatestTriage(): { callId: string; triage: TriageState } | null {
  let latest: { callId: string; triage: TriageState; at: number } | null = null;
  for (const [callId, entry] of store) {
    if (Date.now() - entry.at > MAX_AGE_MS) {
      store.delete(callId);
      continue;
    }
    if (!latest || entry.at > latest.at) {
      latest = { callId, triage: entry.triage, at: entry.at };
    }
  }
  return latest ? { callId: latest.callId, triage: latest.triage } : null;
}
