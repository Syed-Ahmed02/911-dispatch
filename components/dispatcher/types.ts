export type Priority = "P1" | "P2" | "P3" | "P4" | "P5";

export type CallStatus = "ongoing" | "dispatch_sent" | "resolved";

export type EmergencyType = "Medical" | "Fire" | "Police";

export interface TranscriptLine {
  id: string;
  speaker: "caller" | "dispatcher";
  text: string;
  timestamp: number;
}

export interface DispatchCall {
  id: string;
  phoneNumber: string;
  callerName: string;
  locationText: string;
  latitude: number;
  longitude: number;
  emergencyType: EmergencyType;
  priority: Priority;
  status: CallStatus;
  startedAt: number;
  dispatchSentAt?: number;
  resolvedAt?: number;
  tags: string[];
  urgencyScore: number;
  confidence: number;
  transcript: TranscriptLine[];
  notes: string;
}
