import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@myorg/shared";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import OneOnOnePage from "./pages/OneOnOnePage";
import SettingsProfile from "./pages/SettingsProfile";
import AdminTeamRequests from "./pages/AdminTeamRequests";
import AppLayout from "./components/AppLayout";

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/1on1/new" element={<OneOnOnePage />} />
                    <Route path="/1on1/:id" element={<OneOnOnePage />} />
                    <Route path="/settings/profile" element={<SettingsProfile />} />
                    <Route path="/admin/team-requests" element={<AdminTeamRequests />} />
                  </Routes>
                </AppLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
