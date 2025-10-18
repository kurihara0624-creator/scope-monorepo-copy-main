import { useState, type FormEventHandler } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, useAuth } from "@myorg/shared";

interface TeamInviteFormProps {
  submitLabel?: string;
  onSuccess?: (result: { teamId: string; teamName?: string }) => void;
  onFailure?: (error: Error) => void;
  disabled?: boolean;
}

interface InviteDoc {
  teamId?: string;
  teamName?: string;
}

export default function TeamInviteForm({
  submitLabel = "Join team",
  onSuccess,
  onFailure,
  disabled = false,
}: TeamInviteFormProps) {
  const { setTeamIdForSelf } = useAuth();
  const [inviteCode, setInviteCode] = useState("{}");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (isSubmitting || disabled) {
      return;
    }

    const trimmed = inviteCode.trim();
    if (!trimmed) {
      const error = new Error("Enter the invite code.");
      setErrorMessage(error.message);
      setSuccessMessage(null);
      onFailure?.(error);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const inviteSnapshot = await getDoc(doc(db, "teamInvites", trimmed));
      if (!inviteSnapshot.exists()) {
        throw new Error("Invite code not found.");
      }

      const inviteData = inviteSnapshot.data() as InviteDoc;
      if (!inviteData.teamId) {
        throw new Error("This invite code does not contain a team ID.");
      }

      await setTeamIdForSelf(inviteData.teamId);
      const message = inviteData.teamName ? `Joined ${inviteData.teamName}.` : "Joined the team.";
      setSuccessMessage(message);
      setInviteCode("");
      onSuccess?.({ teamId: inviteData.teamId, teamName: inviteData.teamName });
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Failed to set the team.");
      setErrorMessage(err.message);
      setSuccessMessage(null);
      onFailure?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Invite code</span>
        <input
          type="text"
          value={inviteCode}
          onChange={(event) => setInviteCode(event.target.value)}
          placeholder="e.g. TEAM-1234"
          style={{
            padding: "0.75rem 1rem",
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
            fontSize: "1rem",
          }}
          disabled={isSubmitting || disabled}
        />
      </label>
      {errorMessage && <div style={{ color: "#dc2626", fontSize: "0.9rem" }}>{errorMessage}</div>}
      {successMessage && <div style={{ color: "#16a34a", fontSize: "0.9rem" }}>{successMessage}</div>}
      <button
        type="submit"
        disabled={isSubmitting || disabled}
        style={{
          padding: "0.75rem 1rem",
          backgroundColor: isSubmitting || disabled ? "#9ca3af" : "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "0.5rem",
          fontWeight: 600,
          cursor: isSubmitting || disabled ? "not-allowed" : "pointer",
        }}
      >
        {isSubmitting ? "Joining..." : submitLabel}
      </button>
    </form>
  );
}
