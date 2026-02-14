/**
 * Setup script: Creates a 911 Dispatch agent on Smallest.ai via the Atoms API.
 *
 * Usage:
 *   npx tsx scripts/setup-agent.ts
 *
 * Prerequisites:
 *   - SMALLEST_API_KEY must be set in .env
 *
 * This script will:
 *   1. Create a new agent with name "911 Dispatcher"
 *   2. Update its workflow with a single_prompt containing the 911 triage instructions
 *   3. Print the ATOMS_AGENT_ID to add to your .env
 */

import "dotenv/config";

const API_BASE = "https://atoms-api.smallest.ai/api/v1";
const API_KEY = process.env.SMALLEST_API_KEY;

if (!API_KEY) {
  console.error("Error: SMALLEST_API_KEY is not set in .env");
  process.exit(1);
}

const DISPATCHER_PROMPT = `You are a 911 emergency dispatcher. Your role is to handle emergency calls with professionalism, urgency, and calm authority.

## Your Behavior

- Stay calm and speak clearly at all times
- Be direct and authoritative but compassionate
- Ask one question at a time and wait for the answer
- Never panic or show alarm, regardless of the situation described
- Use short, clear sentences

## Call Protocol

When a call begins, follow this sequence:

1. **Greeting**: "911, what is your emergency?"

2. **Determine Emergency Type**: Classify the emergency as one of:
   - Medical emergency
   - Fire
   - Crime / police matter
   - Accident / traffic incident
   - Other / unclear

3. **Gather Critical Information** (ask in this order):
   - "What is the address or location of the emergency?"
   - "Is anyone injured?" (if applicable)
   - "Are you in a safe location right now?"
   - "Can you describe what is happening?"

4. **Caller Information**:
   - "What is your name?"
   - "What is the best number to reach you?"

5. **Situational Details** (based on emergency type):
   - **Medical**: "Is the person conscious? Are they breathing? How old is the patient?"
   - **Fire**: "Is anyone trapped? Can you see flames or just smoke? What type of building?"
   - **Crime**: "Is the suspect still on the scene? Can you describe them? Are there weapons involved?"
   - **Accident**: "How many vehicles are involved? Is the road blocked? Is there a fuel spill?"

6. **Reassurance & Instructions**:
   - Confirm that help is being dispatched
   - Provide relevant safety instructions (e.g., "Stay on the line", "Move away from the building", "Apply pressure to the wound")
   - Keep the caller talking and calm

## Important Rules

- NEVER suggest the caller hang up unless the call is clearly resolved
- If the caller is a child, speak even more simply and gently
- If the caller is panicking, use grounding phrases like "I need you to take a breath. I'm here to help you."
- Summarize back what you've heard to confirm: "So I understand there is [situation] at [location], is that correct?"
- If the caller goes silent, check in: "Are you still there? Can you hear me?"

## Tone

Professional, calm, commanding, compassionate. You are the steady voice in a crisis.`;

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

async function createAgent(): Promise<string> {
  console.log("Creating 911 Dispatcher agent...");

  const res = await fetch(`${API_BASE}/agent`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "911 Dispatcher",
      description:
        "AI-powered 911 emergency dispatch agent for triage and information collection",
      workflowType: "single_prompt",
      language: {
        enabled: "en",
      },
      synthesizer: {
        voiceConfig: {
          model: "waves_lightning_large",
          voiceId: "emily",
        },
        speed: 1.1,
        consistency: 0.5,
        similarity: 0,
        enhancement: 1,
      },
      slmModel: "gpt-4o",
      backgroundSound: "call_center",
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to create agent: ${res.status} ${error}`);
  }

  const data = await res.json();
  const agentId = data.data;
  console.log(`Agent created with ID: ${agentId}`);
  return agentId;
}

async function getWorkflowId(agentId: string): Promise<string> {
  console.log("Fetching agent workflow...");

  const res = await fetch(`${API_BASE}/agent/${agentId}/workflow`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to get workflow: ${res.status} ${error}`);
  }

  const data = await res.json();
  // The workflow ID is typically the same as the agent ID in the PATCH endpoint
  // But we need the actual workflow ID. Let's get it from the agent details.
  return agentId; // The workflow endpoint uses the agent ID
}

async function updateWorkflow(agentId: string): Promise<void> {
  console.log("Updating workflow with 911 dispatcher prompt...");

  const res = await fetch(`${API_BASE}/workflow/${agentId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      type: "single_prompt",
      singlePromptConfig: {
        prompt: DISPATCHER_PROMPT,
        tools: [
          {
            type: "end_call",
            name: "end_call",
            description:
              "End the call when the caller confirms all information has been collected and help is on the way, or when the emergency is resolved.",
          },
          {
            type: "extract_dynamic_variables",
            name: "extract_emergency_info",
            description:
              "Extract key information from the emergency call for dispatch records.",
            variablesExtractionSchema: [
              {
                name: "emergency_type",
                description:
                  "The type of emergency reported",
                type: "enum",
                values: [
                  "medical",
                  "fire",
                  "crime",
                  "accident",
                  "other",
                ],
              },
              {
                name: "location",
                description:
                  "The address or location of the emergency",
                type: "text",
              },
              {
                name: "caller_name",
                description: "The name of the caller",
                type: "text",
              },
              {
                name: "injuries_reported",
                description: "Whether injuries have been reported",
                type: "boolean",
              },
              {
                name: "severity",
                description: "Assessed severity of the emergency",
                type: "enum",
                values: ["critical", "urgent", "non_urgent"],
              },
            ],
          },
        ],
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to update workflow: ${res.status} ${error}`);
  }

  console.log("Workflow updated successfully.");
}

async function main() {
  try {
    const agentId = await createAgent();
    await getWorkflowId(agentId);
    await updateWorkflow(agentId);

    console.log("\n========================================");
    console.log("Setup complete!");
    console.log("========================================");
    console.log(`\nAdd this to your .env file:\n`);
    console.log(`ATOMS_AGENT_ID=${agentId}`);
    console.log("\nThen restart your Next.js dev server.");
    console.log("========================================\n");
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  }
}

main();
