import { NextResponse } from "next/server";
import { getAllTriageStates } from "../store";

/**
 * GET /api/triage/calls – return all triage states (from webhook/function calls).
 * Used by the dashboard to display and update live triage in the UI.
 */
export async function GET() {
  const entries = getAllTriageStates();
  return NextResponse.json({ calls: entries });
}
