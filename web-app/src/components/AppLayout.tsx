import { type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@myorg/shared";
import OnboardingTeamModal from "./OnboardingTeamModal";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";

interface AppLayoutProps {
  children: ReactNode;
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        color: active ? "#2563eb" : "#4b5563",
        fontWeight: active ? 600 : 500,
      }}
    >
      {children}
    </Link>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, loading: profileLoading } = useCurrentUserProfile();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const shouldForceTeamModal = !profileLoading && (!profile || !profile.teamId);

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh" }}>
      <OnboardingTeamModal open={shouldForceTeamModal} />
      <header
        style={{
          background: "white",
          padding: "1rem 2rem",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>Scope</h1>
        </Link>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <nav style={{ display: "flex", gap: "1rem", alignItems: "center", fontSize: "0.95rem" }}>
              <NavLink to="/" active={location.pathname === "/"}>
                Dashboard
              </NavLink>
              <NavLink to="/settings/profile" active={location.pathname.startsWith("/settings")}>
                Profile settings
              </NavLink>
              {profile?.isAdmin && (
                <NavLink to="/admin/team-requests" active={location.pathname.startsWith("/admin")}>
                  Admin requests
                </NavLink>
              )}
            </nav>
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="User avatar"
                style={{ width: "32px", height: "32px", borderRadius: "50%" }}
              />
            )}
            <span style={{ fontSize: "0.875rem" }}>{user.displayName}</span>
            <button
              onClick={handleLogout}
              style={{
                padding: "0.4rem 0.8rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Log out
            </button>
          </div>
        )}
      </header>
      <main style={{ padding: "2rem", maxWidth: "1024px", margin: "0 auto" }}>{children}</main>
    </div>
  );
}
