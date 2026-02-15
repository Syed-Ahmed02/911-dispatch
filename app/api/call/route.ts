import { NextRequest, NextResponse } from "next/server";

const ATOMS_API_BASE = "https://atoms-api.smallest.ai/api/v1";

export async function POST(request: NextRequest) {
  const apiKey = process.env.SMALLEST_API_KEY;
  const defaultAgentId = process.env.ATOMS_AGENT_ID;

  if (!apiKey) {
    return NextResponse.json(
      { error: "SMALLEST_API_KEY is not configured on the server" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const agentId = body.agentId || defaultAgentId;

    if (!agentId) {
      return NextResponse.json(
        { error: "No agentId provided and ATOMS_AGENT_ID is not set" },
        { status: 400 }
      );
    }

    // Call Atoms API to create a webcall session
    const requestBody = { agentId };
    const requestUrl = `${ATOMS_API_BASE}/conversation/webcall`;
    console.log("[call] Requesting webcall", {
      url: requestUrl,
      agentId,
      hasKey: !!apiKey,
      keyPrefix: apiKey?.slice(0, 7) ?? "(none)",
    });

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Atoms API error:", response.status, errorData, {
        agentId,
        requestUrl,
        keyPrefix: apiKey?.slice(0, 10),
      });
      let message = response.statusText;
      try {
        const parsed = JSON.parse(errorData) as {
          message?: string;
          error?: string;
          msg?: string;
          errors?: string[];
        };
        message =
          parsed.errors?.[0] ??
          parsed.message ??
          parsed.error ??
          parsed.msg ??
          message;
      } catch {
        if (errorData && errorData.length < 200) message = errorData;
      }
      return NextResponse.json(
        { error: `Failed to create webcall session: ${message}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return token and host to the client
    return NextResponse.json({
      token: data.data.token,
      host: data.data.host,
      conversationId: data.data.conversationId,
      callId: data.data.callId,
    });
  } catch (error) {
    console.error("Error creating webcall session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
