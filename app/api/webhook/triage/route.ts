import { NextRequest, NextResponse } from "next/server";
import { setTriageForCall } from "@/lib/triage-store";

/**
 * Receives triage_state from Atoms (e.g. API Configuration / webhook in your agent).
 * Configure your Atoms agent to POST to this URL with body:
 * { "call_id": "...", "triage_state": "<JSON string>", "agent_number": "...", "user_number": "..." }
 *
 * For local dev, expose this route with ngrok and set that URL in the Atoms dashboard.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const callId = body.call_id ?? body.callId;
    let triage = body.triage_state;

    if (!callId) {
      return NextResponse.json(
        { error: "Missing call_id" },
        { status: 400 }
      );
    }

    if (typeof triage === "string") {
      try {
        triage = JSON.parse(triage) as Record<string, unknown>;
      } catch {
        return NextResponse.json(
          { error: "triage_state is not valid JSON" },
          { status: 400 }
        );
      }
    }

    if (!triage || typeof triage !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid triage_state" },
        { status: 400 }
      );
    }

    setTriageForCall(String(callId), triage as Record<string, unknown>);
    return NextResponse.json({ ok: true, callId });
  } catch (e) {
    console.error("Webhook triage error:", e);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
