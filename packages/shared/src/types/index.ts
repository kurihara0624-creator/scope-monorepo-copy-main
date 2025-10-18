import type { Timestamp } from "firebase/firestore";

export type OneOnOneStatus = "active" | "completed";

export interface UserDoc {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  lastLoginAt: Timestamp;
  teamId?: string;
  isAdmin?: boolean;
}

export interface OneOnOneDoc {
  id: string;
  managerId: string;
  managerName: string;
  memberId: string;
  memberName: string;
  createdAt: Timestamp;
  sessionId?: string;
  status?: OneOnOneStatus;
  managerPhotoURL?: string;
  agenda?: Item[];
  transcript?: string;
  transcripts?: unknown[];
  summaryPoints?: string;
  summaryNextActions?: string;
  reflection?: string;
  positiveMemo?: string;
  mindmapText?: string;
  mindmap?: {
    nodes: unknown[];
    links: unknown[];
  };
  checkin?: {
    mood: number;
    focus: number;
  };
}

export type TeamChangeRequestStatus = "open" | "approved" | "denied";

export interface TeamChangeRequest {
  id: string;
  uid: string;
  currentTeamId?: string | null;
  requestedTeamId: string;
  reason: string;
  status: TeamChangeRequestStatus;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface AgendaItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Item {
  id: string;
  text: string;
  completed: boolean;
}
