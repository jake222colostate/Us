import type { Heart, Match, Post, Profile } from "@us/types";

export type RelationshipStatus = "match" | "incoming-like" | "outgoing-like";

export interface MatchSummary {
  id: string;
  profile: Profile;
  match: Match;
  compatibilityScore?: number | null;
  lastInteractionAt?: string | null;
  lastMessagePreview?: string | null;
  threadId?: string | null;
}

export interface LikeSummary {
  id: string;
  profile: Profile;
  heart: Heart;
  compatibilityScore?: number | null;
  receivedAt: string;
  status: "incoming" | "outgoing";
}

export type NotificationKind = "match" | "message" | "system" | "safety";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  sentAt: string;
  seenAt?: string | null;
  isMine: boolean;
}

export interface ChatThread {
  id: string;
  partner: Profile;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  createdAt: string;
  matchId?: string | null;
}

export interface FeedReactionPayload {
  postId: string;
  action: "like" | "superlike" | "pass";
}

export interface UpdateProfilePayload {
  display_name?: string;
  bio?: string | null;
  looking_for?: string | null;
  radius_km?: number | null;
  photo_urls?: string[];
  preferences?: Record<string, unknown>;
}

export interface UserSettings {
  user_id: string;
  email_updates: boolean;
  push_notifications: boolean;
  safe_mode: boolean;
  commitment: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  token?: string | null;
  user: AuthUser;
}

export interface SessionResponse {
  user?: AuthUser | null;
  token?: string | null;
}

export interface MatchesResponse {
  matches?: Array<{
    id?: string;
    match?: Match;
    profile?: Profile;
    profile_id?: string;
    compatibility_score?: number;
    compatibilityScore?: number;
    last_message_preview?: string | null;
    last_message_at?: string | null;
    thread_id?: string | null;
    threadId?: string | null;
  }>;
  incoming_likes?: Array<{
    id?: string;
    heart?: Heart;
    profile?: Profile;
    profile_id?: string;
    compatibility_score?: number;
    created_at?: string;
  }>;
  outgoing_likes?: Array<{
    id?: string;
    heart?: Heart;
    profile?: Profile;
    profile_id?: string;
    compatibility_score?: number;
    created_at?: string;
  }>;
}

export interface NotificationsResponse {
  notifications?: NotificationItem[];
}

export interface FeedResponsePage {
  posts: Post[];
  cursor: string | null;
}

export interface ChatThreadsResponse {
  threads?: Array<{
    id: string;
    partner: Profile;
    partner_profile?: Profile;
    partner_id?: string;
    match_id?: string | null;
    unread_count?: number;
    last_message?: {
      id: string;
      sender_id: string;
      body: string;
      sent_at: string;
    } | null;
    last_message_preview?: string | null;
    last_message_at?: string | null;
  }>;
}

export interface ChatMessagesResponse {
  messages?: Array<{
    id: string;
    sender_id: string;
    body: string;
    sent_at: string;
    seen_at?: string | null;
  }>;
}
