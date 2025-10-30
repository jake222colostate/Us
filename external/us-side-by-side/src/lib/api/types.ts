export interface ApiUser {
  id: string;
  name: string;
  email: string;
  age?: number;
  avatarUrl?: string;
  bio?: string;
  distanceMiles?: number;
  onboardingCompleted?: boolean;
  company?: string;
  school?: string;
}

export interface FeedPost {
  id: string;
  caption?: string;
  mediaUrl: string;
  liked: boolean;
  distanceMiles?: number;
  createdAt: string;
  author: ApiUser;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string | null;
}

export interface MatchSummary {
  id: string;
  user: ApiUser;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface ConversationSummary {
  id: string;
  participant: ApiUser;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface MessageResponse extends PaginatedResponse<Message> {}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
  read: boolean;
}

export interface ProfileDetails {
  user: ApiUser;
  bio?: string;
  interests?: string[];
  photos?: string[];
  location?: string;
  agePreference?: {
    min: number;
    max: number;
  };
  maxDistanceMiles?: number;
}

export interface OnboardingStep {
  id: string;
  completed: boolean;
  data?: Record<string, unknown>;
}

export interface OnboardingProgress {
  steps: OnboardingStep[];
  completed: boolean;
}

export interface LikesResponse {
  received: Array<{
    id: string;
    user: ApiUser;
    createdAt: string;
  }>;
  sent: Array<{
    id: string;
    user: ApiUser;
    createdAt: string;
  }>;
}

export interface HealthResponse {
  status: "ok" | "error";
  version?: string;
  timestamp: string;
  message?: string;
}
