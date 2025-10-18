import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import {
  addDoc,
  Timestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  teamChangeRequestsCollection,
  usersCollection,
  auth,
} from "../api/firebase";
import type { TeamChangeRequest, TeamChangeRequestStatus } from "../types";

interface UseTeamChangeRequestsOptions {
  mode?: "self" | "admin";
}

interface UseTeamChangeRequestsResult {
  requests: TeamChangeRequest[];
  isLoading: boolean;
  error: Error | null;
}

export function useTeamChangeRequests({ mode = "self" }: UseTeamChangeRequestsOptions = {}): UseTeamChangeRequestsResult {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TeamChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setRequests([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const constraints =
      mode === "admin"
        ? [orderBy("createdAt", "desc")]
        : [where("uid", "==", user.uid), orderBy("createdAt", "desc")];

    const q = query(teamChangeRequestsCollection, ...constraints);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<TeamChangeRequest, "id">) }));
        setRequests(next);
        setIsLoading(false);
      },
      (err) => {
        console.error("Failed to load team change requests", err);
        setError(err instanceof Error ? err : new Error("Failed to load team change requests"));
        setRequests([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [mode, user]);

  return { requests, isLoading, error };
}

interface SubmitTeamChangeRequestArgs {
  requestedTeamId: string;
  reason: string;
  currentTeamId?: string | null;
}

export async function submitTeamChangeRequest({ requestedTeamId, reason, currentTeamId }: SubmitTeamChangeRequestArgs) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be signed in");
  }

  const payload = {
    uid: currentUser.uid,
    currentTeamId: currentTeamId ?? null,
    requestedTeamId,
    reason,
    status: "open" as TeamChangeRequestStatus,
    createdAt: Timestamp.now(),
  };

  await addDoc(teamChangeRequestsCollection, payload);
}

interface UpdateTeamChangeRequestStatusArgs {
  requestId: string;
  status: Exclude<TeamChangeRequestStatus, "open">;
  requestedTeamId: string;
  uid: string;
}

export async function updateTeamChangeRequestStatus({ requestId, status, requestedTeamId, uid }: UpdateTeamChangeRequestStatusArgs) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be signed in");
  }

  const requestRef = doc(teamChangeRequestsCollection, requestId);
  await setDoc(requestRef, { status, resolvedAt: Timestamp.now() }, { merge: true });

  if (status === "approved") {
    const userRef = doc(usersCollection, uid);
    await setDoc(userRef, { teamId: requestedTeamId }, { merge: true });
  }
}