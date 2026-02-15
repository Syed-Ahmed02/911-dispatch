/**
 * In-memory store for triage state (latest + by call_id).
 * On Vercel serverless, this may not persist across instances; use for demo/single-call.
 * For production, replace with Vercel KV, Postgres, or similar.
 */
export interface StoredTriageState {
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
  _source?: string;
  _callId?: string;
  _event?: string;
  _at?: string;
  [key: string]: unknown;
}

export interface StoredTriageEntry {
  callId: string;
  state: StoredTriageState;
  at: string;
  /** Optional: from Smallest.ai API Call webhook */
  userNumber?: string;
  agentNumber?: string;
}

let latest: StoredTriageState | null = null;
const byCallId = new Map<string, StoredTriageEntry>();

const MAX_CALLS = 50;

export function saveTriageState(state: StoredTriageState): void {
  const at = new Date().toISOString();
  latest = { ...state, _at: at };
  const callId = state._callId ?? `legacy-${at}`;
  byCallId.set(callId, {
    callId,
    state: { ...state, _at: at },
    at,
  });
  pruneCalls();
}

export function saveTriageStateByCallId(
  callId: string,
  state: StoredTriageState,
  meta?: { userNumber?: string; agentNumber?: string }
): void {
  const at = new Date().toISOString();
  const entry: StoredTriageEntry = {
    callId,
    state: { ...state, _at: at, _callId: callId },
    at,
    userNumber: meta?.userNumber,
    agentNumber: meta?.agentNumber,
  };
  byCallId.set(callId, entry);
  latest = entry.state;
  pruneCalls();
}

function pruneCalls(): void {
  if (byCallId.size <= MAX_CALLS) return;
  const entries = Array.from(byCallId.entries()).sort(
    (a, b) => new Date(a[1].at).getTime() - new Date(b[1].at).getTime()
  );
  const toDelete = entries.slice(0, entries.length - MAX_CALLS);
  toDelete.forEach(([id]) => byCallId.delete(id));
}

export function getLatestTriageState(): StoredTriageState | null {
  return latest;
}

export function getAllTriageStates(): StoredTriageEntry[] {
  return Array.from(byCallId.values()).sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}

export function getTriageStateByCallId(callId: string): StoredTriageEntry | null {
  return byCallId.get(callId) ?? null;
}

export function clearTriageState(): void {
  latest = null;
  byCallId.clear();
}
