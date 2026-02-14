/**
 * In-memory store for latest triage state.
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

let latest: StoredTriageState | null = null;

export function saveTriageState(state: StoredTriageState): void {
  latest = {
    ...state,
    _at: new Date().toISOString(),
  };
}

export function getLatestTriageState(): StoredTriageState | null {
  return latest;
}

export function clearTriageState(): void {
  latest = null;
}
