import { useCallback, type CSSProperties } from "react";
import { useAuth } from "@myorg/shared";
import TeamInviteForm from "./TeamInviteForm";

interface OnboardingTeamModalProps {
  open: boolean;
  onCompleted?: () => void;
}

export default function OnboardingTeamModal({ open, onCompleted }: OnboardingTeamModalProps) {
  const { logout } = useAuth();

  const handleSuccess = useCallback(() => {
    onCompleted?.();
  }, [onCompleted]);

  if (!open) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginTop: 0 }}>Join your team</h2>
        <p style={{ color: "#4b5563", fontSize: "0.95rem" }}>
          Enter the invite code shared by your administrator to join a team. You need to belong to a team before you can
          start 1on1 sessions.
        </p>
        <TeamInviteForm onSuccess={handleSuccess} />
        <button
          onClick={handleLogout}
          style={{
            marginTop: "1.5rem",
            background: "none",
            border: "none",
            color: "#2563eb",
            cursor: "pointer",
            textDecoration: "underline",
            fontSize: "0.9rem",
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(15, 23, 42, 0.64)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.5rem",
  zIndex: 9999,
};

const modalStyle: CSSProperties = {
  backgroundColor: "white",
  padding: "2rem",
  borderRadius: "0.75rem",
  maxWidth: "420px",
  width: "100%",
  boxShadow: "0 20px 45px rgba(15, 23, 42, 0.2)",
};
