import { apiRequest } from "./client";
import type {
  ApiUser,
  ConversationSummary,
  FeedPost,
  HealthResponse,
  LikesResponse,
  MatchSummary,
  Message,
  MessageResponse,
  NotificationItem,
  OnboardingProgress,
  PaginatedResponse,
  ProfileDetails,
} from "./types";

export const fetchHealth = () =>
  apiRequest<HealthResponse>("/api/health", { method: "GET" });

export const fetchReady = () => apiRequest<HealthResponse>("/api/ready", { method: "GET" });

export const fetchSession = () =>
  apiRequest<ApiUser>("/api/auth/session", { method: "GET" });

export const login = (email: string, password: string) =>
  apiRequest<ApiUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const signup = (name: string, email: string, password: string) =>
  apiRequest<ApiUser>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

export const refreshSession = () =>
  apiRequest<ApiUser>("/api/auth/refresh", { method: "POST" });

export const logout = () =>
  apiRequest<void>("/api/auth/logout", { method: "POST", parseJson: false });

export const fetchFeed = (cursor?: string) => {
  const search = new URLSearchParams();
  if (cursor) {
    search.set("cursor", cursor);
  }
  const query = search.toString();
  return apiRequest<PaginatedResponse<FeedPost>>(
    `/api/feed${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
};

export const likePost = (postId: string) =>
  apiRequest<{ status: string }>(`/api/feed/${postId}/like`, { method: "POST" });

export const dislikePost = (postId: string) =>
  apiRequest<{ status: string }>(`/api/feed/${postId}/dislike`, { method: "POST" });

export const markMatchFromPost = (postId: string) =>
  apiRequest<{ matchId: string }>("/api/matches", {
    method: "POST",
    body: JSON.stringify({ postId }),
  });

export const fetchMatches = () =>
  apiRequest<MatchSummary[]>("/api/matches", { method: "GET" });

export const fetchConversation = (conversationId: string) =>
  apiRequest<ConversationSummary>(`/api/chat/conversations/${conversationId}`, {
    method: "GET",
  });

export const fetchConversations = () =>
  apiRequest<ConversationSummary[]>("/api/chat/conversations", { method: "GET" });

export const fetchMessages = (conversationId: string, cursor?: string) => {
  const search = new URLSearchParams();
  if (cursor) {
    search.set("cursor", cursor);
  }
  const query = search.toString();
  return apiRequest<MessageResponse>(
    `/api/chat/conversations/${conversationId}/messages${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
};

export const sendMessage = (conversationId: string, body: string) =>
  apiRequest<Message>(`/api/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });

export const fetchNotifications = () =>
  apiRequest<NotificationItem[]>("/api/notifications", { method: "GET" });

export const fetchProfile = () =>
  apiRequest<ProfileDetails>("/api/profile", { method: "GET" });

export const updateProfile = (payload: Partial<ProfileDetails>) =>
  apiRequest<ProfileDetails>("/api/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const uploadAvatar = (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  return apiRequest<ProfileDetails>("/api/profile/avatar", {
    method: "POST",
    body: formData,
    parseJson: true,
  });
};

export const fetchLikes = () =>
  apiRequest<LikesResponse>("/api/likes", { method: "GET" });

export const fetchUserProfile = (userId: string) =>
  apiRequest<ProfileDetails>(`/api/users/${userId}`, { method: "GET" });

export const fetchOnboarding = () =>
  apiRequest<OnboardingProgress>("/api/onboarding", { method: "GET" });

export const submitOnboardingStep = (stepId: string, data: Record<string, unknown>) =>
  apiRequest<OnboardingProgress>("/api/onboarding", {
    method: "POST",
    body: JSON.stringify({ stepId, data }),
  });
