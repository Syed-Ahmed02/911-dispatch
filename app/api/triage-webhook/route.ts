import { NextRequest, NextResponse } from "next/server";
import { saveTriageState } from "@/app/api/triage/store";

/**
 * Atoms webhook endpoint. Configure this URL in your Atoms dashboard:
 * https://<your-vercel-url>/api/triage-webhook
 *
 * Events: pre-conversation, post-conversation, analytics-completed.
 * Post-conversation includes metadata.variables and metadata.transcript.
 * If your agent writes triage_state to a variable, it will appear in variables.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Atoms sends: { event, metadata, url?, description?, id? }
    const event = body.event as string | undefined;
    const metadata = body.metadata as Record<string, unknown> | undefined;

    if (metadata?.variables && typeof metadata.variables === "object") {
      const vars = metadata.variables as Record<string, unknown>;
      // Try common keys the agent might use for triage JSON
      const raw =
        vars.triage_state ??
        vars.triageState ??
        vars.triage_raw ??
        (typeof vars.triage === "string" ? vars.triage : null);
      if (raw != null) {
        const triageState =
          typeof raw === "string" ? safeParseTriage(raw) : raw;
        if (triageState) {
          saveTriageState({
            ...triageState,
            _source: "webhook",
            _callId: (metadata as { callId?: string }).callId,
            _event: event,
          });
        }
      }
    }

    // Post-conversation transcript might contain the last state in some setups
    if (metadata?.transcript && Array.isArray(metadata.transcript)) {
      const lastAgent = [...(metadata.transcript as { role: string; content: string }[])]
        .reverse()
        .find((m) => m.role === "agent" && m.content);
      if (lastAgent?.content) {
        const parsed = tryExtractTriageFromText(lastAgent.content);
        if (parsed) {
          saveTriageState({
            ...parsed,
            _source: "webhook_transcript",
            _callId: (metadata as { callId?: string }).callId,
            _event: event,
          });
        }
      }
    }

    return NextResponse.json({ received: true, event });
  } catch (e) {
    console.error("[triage-webhook] Error:", e);
    return NextResponse.json(
      { received: true, error: "Parse error" },
      { status: 200 }
    );
  }
}

function safeParseTriage(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function tryExtractTriageFromText(text: string): Record<string, unknown> | null {
  try {
    const match = text.match(/\{[\s\S]*"location_raw"[\s\S]*\}/);
    if (match) {
      return safeParseTriage(match[0]);
    }
  } catch {
    // ignore
  }
  return null;
}
