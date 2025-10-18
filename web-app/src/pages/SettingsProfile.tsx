import { useState, type CSSProperties, FormEvent } from "react";
import TeamInviteForm from "../components/TeamInviteForm";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";
import { submitTeamChangeRequest, useTeamChangeRequests } from "@myorg/shared";

export default function SettingsProfile() {
  const { profile, loading, error } = useCurrentUserProfile();
  const {
    requests,
    isLoading: isLoadingRequests,
    error: requestsError,
  } = useTeamChangeRequests({ mode: "self" });
  const [requestedTeamId, setRequestedTeamId] = useState("");
  const [reason, setReason] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return <div style={{ color: "#dc2626" }}>Failed to load profile information: {error.message}</div>;
  }

  const hasOpenRequest = requests.some((req) => req.status === "open");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requestedTeamId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await submitTeamChangeRequest({
        requestedTeamId,
        reason,
        currentTeamId: profile?.teamId ?? null,
      });
      setRequestedTeamId("");
      setReason("");
      setSubmitSuccess("Request submitted successfully.");
    } catch (err) {
      console.error("Failed to submit team change request", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <section style={cardStyle}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>Profile</h1>
        <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
          <InfoRow label="Display name" value={profile?.displayName ?? "Not set"} />
          <InfoRow label="Email" value={profile?.email ?? "Not set"} />
          <InfoRow label="Team ID" value={profile?.teamId ?? "Not set"} />
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>Team setup</h2>
        {profile?.teamId ? (
          <div style={{ marginTop: "1rem", color: "#4b5563", lineHeight: 1.6 }}>
            You are already a member of team <span style={{ fontWeight: 600 }}>{profile.teamId}</span>.
          </div>
        ) : (
          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, color: "#4b5563" }}>
              Enter the invite code shared by your administrator to join a team. You must join a team before you can use
              1on1 sessions.
            </p>
            <TeamInviteForm />
          </div>
        )}
      </section>

      <section style={cardStyle}>
        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>Request a team change</h2>
        <p style={{ marginTop: "0.75rem", color: "#4b5563", lineHeight: 1.6 }}>
          Submit a request if you need to join a different team. An administrator will review your request and update your
          team assignment.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontWeight: 600 }}>Requested team ID</span>
            <input
              type="text"
              value={requestedTeamId}
              onChange={(event) => setRequestedTeamId(event.target.value)}
              placeholder="e.g. TEAM-002"
              disabled={isSubmitting || hasOpenRequest}
              style={{ padding: "0.75rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontWeight: 600 }}>Reason (optional)</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Briefly describe why you need to move"
              disabled={isSubmitting || hasOpenRequest}
              style={{ padding: "0.75rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", minHeight: "120px" }}
            />
          </label>

          {submitError && <div style={{ color: "#dc2626" }}>{submitError}</div>}
          {submitSuccess && <div style={{ color: "#16a34a" }}>{submitSuccess}</div>}

          <button
            type="submit"
            disabled={isSubmitting || hasOpenRequest || !requestedTeamId.trim()}
            style={{
              padding: "0.75rem 1rem",
              background: isSubmitting || hasOpenRequest ? "#9ca3af" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: 600,
              cursor: isSubmitting || hasOpenRequest ? "not-allowed" : "pointer",
            }}
          >
            {hasOpenRequest ? "Pending request" : isSubmitting ? "Submitting..." : "Submit request"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Your past requests</h3>
          {isLoadingRequests ? (
            <p>Loading requests...</p>
          ) : requestsError ? (
            <p style={{ color: "#dc2626" }}>Failed to load requests: {requestsError.message}</p>
          ) : requests.length === 0 ? (
            <p>No requests submitted yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {requests.map((req) => (
                <li
                  key={req.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    padding: "0.75rem 1rem",
                    background: "#f9fafb",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600 }}>Requested team: {req.requestedTeamId}</span>
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
                  <div style={{ fontSize: "0.85rem", color: "#4b5563", marginBottom: "0.25rem" }}>
                    Submitted: {req.createdAt.toDate().toLocaleString()}
                  </div>
                  {req.reason && <div style={{ fontSize: "0.9rem", color: "#374151" }}>{req.reason}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.95rem", color: "#111827" }}>
      <span style={{ width: "120px", color: "#6b7280" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const cardStyle: CSSProperties = {
  background: "white",
  padding: "1.5rem",
  borderRadius: "0.75rem",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb",
};