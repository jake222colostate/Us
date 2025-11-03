import "./App.css";

import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useMemo } from "react";

import BottomNav from "./components/BottomNav";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider, useTheme } from "./components/ThemeProvider";
import { ToastProvider } from "./hooks/use-toast";
import { ProfileProvider, useProfile } from "./hooks/useProfile";
import { useAuth } from "./auth";

import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Likes from "./pages/Likes";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Onboarding from "./pages/Onboarding";
import Safety from "./pages/Safety";
import Help from "./pages/Help";
import Auth from "./pages/Auth";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/thumbs/svg?seed=Us";

type AppHeaderProps = {
  onLogout(): void;
};

function AppHeader({ onLogout }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { profile, loading } = useProfile();
  const { user } = useAuth();

  const displayName = useMemo(() => {
    if (profile?.display_name) return profile.display_name;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "Profile";
  }, [profile?.display_name, user?.displayName, user?.email]);

  const avatarUrl =
    profile?.photos?.find((photo) => photo.is_primary)?.url ??
    profile?.photos?.[0]?.url ??
    user?.avatarUrl ??
    DEFAULT_AVATAR;

  return (
    <header className="app-header">
      <Link to="/" className="app-logo">
        us<span>match</span>
      </Link>
      <div className="app-header__actions">
        <button
          type="button"
          className="app-header__theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
        >
          {theme === "dark" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 18a1 1 0 0 1 1 1v1.5a1.5 1.5 0 0 1-3 0V19a1 1 0 0 1 1-1zm0-12a1 1 0 0 1-1-1V3.5a1.5 1.5 0 0 1 3 0V5a1 1 0 0 1-1 1zm6 6a1 1 0 0 1 1-1h1.5a1.5 1.5 0 0 1 0 3H19a1 1 0 0 1-1-1zm-12 0a1 1 0 0 1-1 1H3.5a1.5 1.5 0 0 1 0-3H5a1 1 0 0 1 1 1zm9.657-4.657a1 1 0 0 1 0-1.414l1.061-1.06a1.5 1.5 0 1 1 2.122 2.12l-1.06 1.062a1 1 0 0 1-1.415 0zm-9.9 9.9a1 1 0 0 1-1.414 0l-1.06-1.061a1.5 1.5 0 1 1 2.12-2.122l1.062 1.06a1 1 0 0 1 0 1.415zm0-9.9a1 1 0 0 1 0-1.414L7.818 6.03a1.5 1.5 0 1 1 2.121 2.12L8.88 9.213a1 1 0 0 1-1.415 0zm9.9 9.9a1 1 0 0 1 1.414 0l1.06 1.062a1.5 1.5 0 0 1-2.12 2.12l-1.062-1.06a1 1 0 0 1 0-1.415zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
            </svg>
          )}
        </button>
        {user ? (
          <>
            <Link to="/profile" className="app-header__profile" aria-busy={loading}>
              <span className="app-header__avatar">
                <img src={avatarUrl} alt="Your avatar" referrerPolicy="no-referrer" />
              </span>
              <span className="app-header__name">{displayName}</span>
            </Link>
            <button type="button" className="app-header__logout" onClick={onLogout} title="Sign out">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M15.75 3a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V4.5h-9v15h9v-1.5a.75.75 0 0 1 1.5 0v2.25a.75.75 0 0 1-.75.75h-10.5A1.5 1.5 0 0 1 3.75 20.5v-17A1.5 1.5 0 0 1 5.25 2h10.5zm3.53 8.47a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H10.5a.75.75 0 0 1 0-1.5h5.44l-1.72-1.72a.75.75 0 0 1 1.06-1.06z" />
              </svg>
            </button>
          </>
        ) : (
          <Link to="/auth" className="btn btn--primary">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

function AppShell() {
  const { logout } = useAuth();

  return (
    <div className="app-shell">
      <AppHeader onLogout={logout} />
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/likes"
            element={
              <ProtectedRoute>
                <Likes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <Matches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/safety"
            element={
              <ProtectedRoute>
                <Safety />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <Help />
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/user/:id"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ProfileProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </ProfileProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
