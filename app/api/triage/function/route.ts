import { NextRequest, NextResponse } from "next/server";
import { saveTriageStateByCallId, type StoredTriageState } from "../store";

/**
 * Smallest.ai "API Call Function" webhook for triage_update.
 *
 * Configure in Smallest.ai:
 * - Function name: triage_update
 * - URL: https://<your-vercel-url>/api/triage/function
 * - Method: POST
 * - Body: { "call_id": "{{call_id}}", "agent_number": "{{agent_number}}", "user_number": "{{user_number}}", "triage_state": "{{triage_state}}" }
 *
 * triage_state can be a JSON string (from the LLM) or already an object.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const callId =
      body.call_id ?? body.callId ?? null;
    const agentNumber = body.agent_number ?? body.agentNumber;
    const userNumber = body.user_number ?? body.userNumber;
    let raw = body.triage_state ?? body.triageState ?? null;

    if (!callId) {
      return NextResponse.json(
        { error: "Missing call_id" },
        { status: 400 }
      );
    }

    if (raw == null) {
      return NextResponse.json(
        { error: "Missing triage_state" },
        { status: 400 }
      );
    }

    let state: Record<string, unknown>;
    if (typeof raw === "string") {
      try {
        state = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return NextResponse.json(
          { error: "triage_state is not valid JSON" },
          { status: 400 }
        );
      }
    } else if (typeof raw === "object" && raw !== null) {
      state = raw as Record<string, unknown>;
    } else {
      return NextResponse.json(
        { error: "triage_state must be a JSON string or object" },
        { status: 400 }
      );
    }

    saveTriageStateByCallId(callId, state as StoredTriageState, {
      userNumber: typeof userNumber === "string" ? userNumber : undefined,
      agentNumber: typeof agentNumber === "string" ? agentNumber : undefined,
    });

    return NextResponse.json({ ok: true, callId });
  } catch (e) {
    console.error("[triage/function] Error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
