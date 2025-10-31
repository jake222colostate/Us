import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as RRD from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ServerHealthBanner } from "@/components/ServerHealthBanner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Auth from "@/pages/Auth";
import Chat from "@/pages/Chat";
import EditProfile from "@/pages/EditProfile";
import Feed from "@/pages/Feed";
import Help from "@/pages/Help";
import Likes from "@/pages/Likes";
import Matches from "@/pages/Matches";
import NotFound from "@/pages/NotFound";
import Notifications from "@/pages/Notifications";
import Onboarding from "@/pages/Onboarding";
import Profile from "@/pages/Profile";
import Safety from "@/pages/Safety";
import Settings from "@/pages/Settings";
import UserProfile from "@/pages/UserProfile";
import * as React from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RRD.BrowserRouter>
          <AuthProvider>
            <ServerHealthBanner />
            <RRD.Routes>
              <RRD.Route path="/auth" element={<Auth />} />
              <RRD.Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <RRD.Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                }
              />
              <RRD.Route
                path="/likes"
                element={
                  <ProtectedRoute>
                    <Likes />
                  </ProtectedRoute>
                }
              />
              <RRD.Route
                path="/matches"
                element={
                  <ProtectedRoute>
                    <Matches />
                  </ProtectedRoute>
                }
              />
              <RRD.Route
                path="/chat/:matchId"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <RRD.Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <RRD.Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <RRD.Route
                path="/edit-profile"
                element={
                  <ProtectedRoute>
                    <EditProfile />
                  </ProtectedRoute>
                }
              />
              <RRD.Route
                path="/user/:userId"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <RRD.Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <RRD.Route
                path="/help"
                element={
                  <ProtectedRoute>
                    <Help />
                  </ProtectedRoute>
                }
              />
              <RRD.Route
                path="/safety"
                element={
                  <ProtectedRoute>
                    <Safety />
                  </ProtectedRoute>
                }
              />
              <RRD.Route path="*" element={<NotFound />} />
            </RRD.Routes>
          </AuthProvider>
        </RRD.BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
