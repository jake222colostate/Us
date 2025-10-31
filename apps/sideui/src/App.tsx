import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// pages
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Likes from "./pages/Likes";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Onboarding from "./pages/Onboarding";
import Notifications from "./pages/Notifications";
import EditProfile from "./pages/EditProfile";
import Safety from "./pages/Safety";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import UserProfile from "./pages/UserProfile";

// components
import BottomNav from "./components/BottomNav";
import { ThemeProvider } from "./components/ThemeProvider";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/likes" element={<Likes />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/user/:id" element={<UserProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/safety" element={<Safety />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <BottomNav />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
