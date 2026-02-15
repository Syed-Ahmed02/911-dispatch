import type { DispatchCall, Priority } from "./types";

const now = Date.now();

function minsAgo(minutes: number): number {
  return now - minutes * 60 * 1000;
}

export const INITIAL_CALLS: DispatchCall[] = [
  {
    id: "c-1001",
    phoneNumber: "+1 (415) 555-0198",
    callerName: "Ava Miller",
    locationText: "412 Pine St, San Francisco, CA",
    latitude: 37.7893,
    longitude: -122.4039,
    emergencyType: "Medical",
    priority: "P1",
    status: "ongoing",
    startedAt: minsAgo(7),
    tags: ["unconscious", "not breathing"],
    urgencyScore: 96,
    confidence: 0.93,
    transcript: [
      { id: "t1", speaker: "dispatcher", text: "911, what is your emergency?", timestamp: minsAgo(7) },
      { id: "t2", speaker: "caller", text: "My father collapsed and is not responding.", timestamp: minsAgo(6) },
    ],
    notes: "CPR guidance provided.",
  },
  {
    id: "c-1002",
    phoneNumber: "+1 (415) 555-0165",
    callerName: "Noah Patel",
    locationText: "89 Howard St, San Francisco, CA",
    latitude: 37.7884,
    longitude: -122.3969,
    emergencyType: "Fire",
    priority: "P2",
    status: "dispatch_sent",
    startedAt: minsAgo(19),
    dispatchSentAt: minsAgo(14),
    tags: ["apartment", "smoke", "children inside"],
    urgencyScore: 89,
    confidence: 0.88,
    transcript: [
      { id: "t3", speaker: "caller", text: "There is smoke in the hallway and alarms are going off.", timestamp: minsAgo(19) },
    ],
    notes: "Engine 4 and Ladder 2 en route.",
  },
  {
    id: "c-1003",
    phoneNumber: "+1 (628) 555-0121",
    callerName: "Olivia Chen",
    locationText: "16th St & Mission St, San Francisco, CA",
    latitude: 37.7651,
    longitude: -122.4197,
    emergencyType: "Police",
    priority: "P3",
    status: "ongoing",
    startedAt: minsAgo(5),
    tags: ["assault", "suspect fleeing"],
    urgencyScore: 76,
    confidence: 0.82,
    transcript: [
      { id: "t4", speaker: "caller", text: "Someone just attacked a man and ran toward Mission.", timestamp: minsAgo(4) },
    ],
    notes: "Requesting additional witness details.",
  },
  {
    id: "c-1004",
    phoneNumber: "+1 (415) 555-0114",
    callerName: "Ethan Brooks",
    locationText: "Folsom St, San Francisco, CA",
    latitude: 37.783,
    longitude: -122.3995,
    emergencyType: "Medical",
    priority: "P2",
    status: "resolved",
    startedAt: minsAgo(52),
    dispatchSentAt: minsAgo(45),
    resolvedAt: minsAgo(21),
    tags: ["allergic reaction", "epi-pen used"],
    urgencyScore: 70,
    confidence: 0.91,
    transcript: [],
    notes: "Caller stable when EMS arrived.",
  },
  {
    id: "c-1005",
    phoneNumber: "+1 (510) 555-0182",
    callerName: "Mia Johnson",
    locationText: "3rd St, San Francisco, CA",
    latitude: 37.7753,
    longitude: -122.3883,
    emergencyType: "Fire",
    priority: "P4",
    status: "ongoing",
    startedAt: minsAgo(2),
    tags: ["trash fire", "no injuries"],
    urgencyScore: 41,
    confidence: 0.78,
    transcript: [
      { id: "t5", speaker: "caller", text: "Small fire near a dumpster behind the store.", timestamp: minsAgo(1) },
    ],
    notes: "",
  },
];

export function priorityWeight(priority: Priority): number {
  const weights: Record<Priority, number> = {
    P1: 1,
    P2: 2,
    P3: 3,
    P4: 4,
    P5: 5,
  };
  return weights[priority];
}

const LIVE_TRANSCRIPT_SNIPPETS = [
  "Can you confirm the nearest cross street?",
  "Help is on the way, stay with me.",
  "Is the patient breathing right now?",
  "Do you see any active flames?",
  "Are you in a safe location?",
  "Can you describe the suspect clothing?",
];

export function randomLiveLine(): string {
  const index = Math.floor(Math.random() * LIVE_TRANSCRIPT_SNIPPETS.length);
  return LIVE_TRANSCRIPT_SNIPPETS[index];
}
