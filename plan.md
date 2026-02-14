# Plan: Mastra + Smallest.ai (Atoms) — Option A

Use Mastra as the orchestrator and the Smallest.ai Node SDK to create/manage Atoms agents, start outbound calls, and optionally use Waves for TTS from Mastra tools.

## Overview

- **Mastra**: App logic, workflows, agents, tools.
- **smallestai (Node SDK)**: `AtomsClient` (agents, outbound calls, knowledge bases), `WavesClient` (TTS).
- **Atoms**: Runs the actual voice conversations (Pulse, Electron, Lightning) in their cloud.

## Prerequisites

- [Smallest.ai](https://console.smallest.ai) account and API key.
- Environment variable: `SMALLEST_API_KEY` (or pass via SDK config).
- Optional: `ATOMS_AGENT_ID` for a pre-created agent to use in calls.

## Implementation Steps

### 1. Install dependency

```bash
npm install smallestai
# or
pnpm add smallestai
```

### 2. Environment

In `.env` (and `.env.example` for docs):

```env
SMALLEST_API_KEY=your_smallest_api_key
ATOMS_AGENT_ID=your_agent_id_from_dashboard
```

### 3. Shared Atoms client (implementation file)

Create a small module so Mastra tools/workflows can reuse one configured client.

**File:** `agents/mastra/lib/atoms-client.ts` (or `src/lib/atoms-client.ts`)

- Export an `AtomsClient` instance (from `smallestai`) configured with `SMALLEST_API_KEY` (or `Configuration` with `accessToken`).
- Optionally export a `WavesClient` instance for TTS in tools.
- Keep API key loading from `process.env`; no secrets in code.

### 4. Mastra tool: start outbound call

**File:** e.g. `agents/mastra/tools/start-atoms-call.ts`

- Use Mastra `createTool()` (or existing tool pattern in the project).
- Inputs: `phoneNumber` (string, E.164), optional `agentId` (default from env), optional `variables` (object).
- Implementation: call `atomsClient.startOutboundCall({ agentId, phoneNumber, variables })`.
- Return: `{ conversationId, success }` (or error message) for the workflow/agent.

### 5. Mastra tool: Waves TTS (optional)

**File:** e.g. `agents/mastra/tools/waves-tts.ts`

- Inputs: `text`, optional `voice_id`, optional `speed`, optional `model` (e.g. `"lightning"`).
- Implementation: call `wavesClient.synthesize(model, { text, voice_id, add_wav_header, sample_rate, speed })`.
- Return: either a base64 audio payload or a URL/path if you write the file somewhere the agent can reference (decide per use case).

### 6. Wire into Mastra

- In `agents/mastra/index.ts` (or wherever agents/tools are registered): import and register the new tools (e.g. `startAtomsCall`, `wavesTts`) on the agent(s) or workflows that need them.
- In `agents/mastra/agents/` (e.g. your dispatch or main agent): add instructions that describe when to start an Atoms call or when to use TTS (e.g. "To place a voice call, use the startAtomsCall tool with E.164 phone number").

### 7. Create agent via API (optional)

If you want to create/update agents from code instead of only the dashboard:

- Use `AtomsClient.createAgent(...)` with name, description, language, synthesizer (e.g. Waves Lightning + voice_id), `slmModel` (e.g. `"electron-v1"`).
- Store the returned agent ID in env or config and use it in the start-outbound-call tool.

### 8. Knowledge base (optional)

- Use `AtomsClient.createKnowledgeBase()` and `uploadMediaToKnowledgeBase()` (e.g. PDF) for an agent that already exists.
- Attach the knowledge base to the agent via Atoms API/docs so the voice agent can use it during calls.

## Implementation file summary

| File                                      | Purpose                                                           |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `agents/mastra/lib/atoms-client.ts`       | Configured `AtomsClient` and optionally `WavesClient` from env.   |
| `agents/mastra/tools/start-atoms-call.ts` | Mastra tool to start an Atoms outbound call.                      |
| `agents/mastra/tools/waves-tts.ts`        | (Optional) Mastra tool to synthesize speech via Waves.            |
| `agents/mastra/agents/*` + `index.ts`     | Register tools and add agent instructions for when to call/Waves. |

## References

- [Smallest Node SDK](https://github.com/smallest-inc/smallest-node-sdk) — `AtomsClient`, `WavesClient`.
- [Atoms API — Start outbound call](https://atoms-docs.smallest.ai/api-reference/calls/start-an-outbound-call.md).
- [Atoms Client Libraries (token flow for web)](https://atoms-docs.smallest.ai/client-libraries/overview).
- Project: Mastra entry `agents/mastra/index.ts`; existing tools in `agents/mastra/tools/`.
