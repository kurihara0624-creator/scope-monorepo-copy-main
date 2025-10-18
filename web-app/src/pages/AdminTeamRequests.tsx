import { useState } from "react";
import { useTeamChangeRequests, updateTeamChangeRequestStatus } from "@myorg/shared";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";

const cardStyle = {
  background: "white",
  padding: "1.5rem",
  borderRadius: "0.75rem",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb",
} as const;

export default function AdminTeamRequests() {
  const { profile, loading, error } = useCurrentUserProfile();
  const { requests, isLoading, error: requestsError } = useTeamChangeRequests({ mode: "admin" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return <div style={{ color: "#dc2626" }}>Failed to load profile information: {error.message}</div>;
  }

  if (!profile?.isAdmin) {
    return <div>You do not have permission to view this page.</div>;
  }

  const handleUpdate = async (
    requestId: string,
    status: "approved" | "denied",
    requestedTeamId: string,
    uid: string
  ) => {
    try {
      setActionInFlight(requestId + status);
      setActionError(null);
      await updateTeamChangeRequestStatus({
        requestId,
        status,
        requestedTeamId,
        uid,
      });
    } catch (err) {
      console.error("Failed to update request", err);
      setActionError(err instanceof Error ? err.message : "Failed to update request.");
    } finally {
      setActionInFlight(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <section style={cardStyle}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>Team change requests</h1>
        <p style={{ marginTop: "0.75rem", color: "#4b5563" }}>
          Review requests from members who need to move to a different team. Approving will update the member's team id.
        </p>

        {actionError && <div style={{ color: "#dc2626", marginTop: "0.75rem" }}>{actionError}</div>}

        {isLoading ? (
          <p>Loading requests...</p>
        ) : requestsError ? (
          <p style={{ color: "#dc2626" }}>Failed to load requests: {requestsError.message}</p>
        ) : requests.length === 0 ? (
          <p style={{ marginTop: "1rem" }}>There are no requests at the moment.</p>
        ) : (
          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {requests.map((req) => (
              <div
                key={req.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  background: req.status === "open" ? "#f8fafc" : "#f9fafb",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Member UID: {req.uid}</div>
                    <div style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                      Current team: {req.currentTeamId ?? "(none)"}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                      Requested team: {req.requestedTeamId}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                      Submitted: {req.createdAt.toDate().toLocaleString()}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      padding: "0.1rem 0.6rem",
                      borderRadius: "999px",
                      background:
                        req.status === "approved"
                          ? "#dcfce7"
                          : req.status === "denied"
                          ? "#fee2e2"
                          : "#e0f2fe",
                      color:
                        req.status === "approved"
                          ? "#166534"
                          : req.status === "denied"
                          ? "#b91c1c"
                          : "#0c4a6e",
                    }}
                  >
                    {req.status}
                  </span>
                </div>
                {req.reason && (
                  <div style={{ marginTop: "0.75rem", color: "#374151" }}>Reason: {req.reason}</div>
                )}
                {req.status === "open" && (
                  <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={() => handleUpdate(req.id, "approved", req.requestedTeamId, req.uid)}
                      disabled={actionInFlight !== null}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#16a34a",
                        color: "white",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: actionInFlight ? "not-allowed" : "pointer",
                      }}
                    >
                      {actionInFlight === `${req.id}approved` ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleUpdate(req.id, "denied", req.requestedTeamId, req.uid)}
                      disabled={actionInFlight !== null}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: "0.5rem",
                        cursor: actionInFlight ? "not-allowed" : "pointer",
                      }}
                    >
                      {actionInFlight === `${req.id}denied` ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}