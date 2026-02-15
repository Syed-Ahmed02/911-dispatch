import { NextRequest, NextResponse } from "next/server";
import {
  getLatestTriageState,
  saveTriageState,
  saveTriageStateByCallId,
  type StoredTriageState,
} from "./store";

/**
 * GET /api/triage – return the latest extracted triage state (from webhook or client).
 */
export async function GET() {
  const state = getLatestTriageState();
  if (!state) {
    return NextResponse.json({ triage: null });
  }
  return NextResponse.json({ triage: state });
}

/**
 * POST /api/triage – store triage state (e.g. from client when SDK emits "update").
 * Body: triage_state object or { triage_state: "<json string>" }, optional call_id.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let state: StoredTriageState;

    if (body.triage_state != null) {
      const raw = body.triage_state;
      state =
        typeof raw === "string"
          ? (JSON.parse(raw) as StoredTriageState)
          : (raw as StoredTriageState);
    } else if (body.location_raw !== undefined || body.category !== undefined) {
      state = body as StoredTriageState;
    } else {
      return NextResponse.json(
        { error: "Send triage_state (object or JSON string) or triage fields" },
        { status: 400 }
      );
    }

    const withSource = { ...state, _source: state._source ?? "client" };
    const callId = body.call_id ?? body.callId ?? null;

    if (callId && typeof callId === "string") {
      saveTriageStateByCallId(callId, withSource);
    } else {
      saveTriageState(withSource);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[triage POST] Error:", e);
    return NextResponse.json(
      { error: "Invalid JSON or triage_state" },
      { status: 400 }
    );
  }
}
