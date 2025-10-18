import { Link } from "react-router-dom";
import type { OneOnOneDoc } from "@myorg/shared/types";

interface SessionHistoryProps {
  sessions: OneOnOneDoc[];
}

export default function SessionHistory({ sessions }: SessionHistoryProps) {
  if (sessions.length === 0) {
    return <p>No completed 1on1 sessions yet.</p>;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
      {sessions.map((session) => {
        const memberName = session.memberName ?? "Unknown member";
        const managerName = session.managerName ?? "Unknown manager";
        const completedAt = session.createdAt?.toDate ? session.createdAt.toDate().toLocaleString() : "Unknown";
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(memberName)}&background=random`;

        return (
          <Link key={session.id} to={`/1on1/${session.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div
              style={{
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem",
                borderRadius: "0.5rem",
                border: "1px solid #e5e7eb",
                background: "white",
                transition: "all 0.2s",
                cursor: "pointer",
                minWidth: "160px",
              }}
            >
              <img src={avatarUrl} alt={memberName} style={{ width: "64px", height: "64px", borderRadius: "50%" }} />
              <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, wordBreak: "break-word", maxWidth: "160px" }}>{memberName}</p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280" }}>Manager: {managerName}</p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280" }}>Completed: {completedAt}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
