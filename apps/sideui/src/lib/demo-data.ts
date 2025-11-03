import type { FeedResponse, Heart, Match, Profile, ProfilePhoto } from "@us/types";
import type { ChatMessage, ChatThread, LikeSummary, MatchSummary, NotificationItem } from "../types";

const now = new Date();

function daysAgo(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}

const profileBase = {
  created_at: daysAgo(120),
  updated_at: hoursAgo(5),
  radius_km: 25,
  verification_status: "approved" as const,
  visibility_score: 1.2,
} as const;
function createPhoto(userId: string, url: string, index: number): ProfilePhoto {
  return {
    id: `${userId}-photo-${index + 1}`,
    user_id: userId,
    url,
    storage_path: url,
    is_primary: index === 0,
    is_verification_photo: false,
    created_at: daysAgo(30 - index),
  };
}

type DemoProfileInput = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  birthdate: string;
  age: number;
  gender: Profile["gender"];
  lookingFor: Profile["looking_for"];
  photoUrls: string[];
  location: Profile["location"];
  locationText: string;
  radiusKm?: number;
  interests?: string[];
  verification?: Profile["verification_status"];
  updatedHoursAgo?: number;
};

function createProfile(input: DemoProfileInput): Profile {
  const createdAt = daysAgo(180);
  const updatedAt = hoursAgo(input.updatedHoursAgo ?? 4);
  const photos = input.photoUrls.map((url, index) => createPhoto(input.id, url, index));
  return {
    id: input.id,
    user_id: input.id,
    email: `${input.username}@demo.us`,
    username: input.username,
    display_name: input.displayName,
    bio: input.bio,
    birthdate: input.birthdate,
    age: input.age,
    gender: input.gender,
    looking_for: input.lookingFor,
    location: input.location,
    location_text: input.locationText,
    radius_km: input.radiusKm ?? 25,
    interests: input.interests ?? ["Photography", "Travel", "Design"],
    verification_status: input.verification ?? "verified",
    is_active: true,
    preferences: null,
    photos,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

export const demoProfile: Profile = createProfile({
  id: "demo-user-001",
  username: "jules",
  displayName: "Jules Hart",
  bio: "Product photographer who loves spontaneous road trips and rooftop sunsets.",
  birthdate: "1994-02-18",
  age: 31,
  gender: "woman",
  lookingFor: "everyone",
  photoUrls: [
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=800&q=80",
  ],
  location: { latitude: 34.0522, longitude: -118.2437 },
  radius_km: 35,
  created_at: daysAgo(240),
  updated_at: hoursAgo(2),
  verification_status: "approved",
  visibility_score: 1.6,
};
  locationText: "Los Angeles, CA",
  radiusKm: 35,
  interests: ["Photography", "Road trips", "Sunsets"],
  verification: "verified",
  updatedHoursAgo: 2,
});

export const demoProfiles: Profile[] = [
  demoProfile,
  createProfile({
    id: "demo-user-002",
    username: "miles",
    displayName: "Miles Chen",
    bio: "Product designer, vinyl collector, and weekend climber.",
    birthdate: "1991-11-05",
    age: 34,
    gender: "man",
    lookingFor: "everyone",
    photoUrls: [
      "https://images.unsplash.com/photo-1487412720507-7b1dbb0e0d5a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80",
    ],
    location: { latitude: 34.11, longitude: -118.15 },
    locationText: "Pasadena, CA",
    interests: ["Climbing", "Vinyl", "Typography"],
    verification: "verified",
    updatedHoursAgo: 8,
  }),
  createProfile({
    id: "demo-user-003",
    username: "noor",
    displayName: "Noor Patel",
    bio: "Immersive theatre producer. Will absolutely make you laugh at bad puns.",
    birthdate: "1993-08-21",
    age: 31,
    gender: "woman",
    lookingFor: "men",
    photoUrls: [
      "https://images.unsplash.com/photo-1544723795-432537e322cb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
    ],
    location: { latitude: 34.06, longitude: -118.3 },
    locationText: "West Hollywood, CA",
    interests: ["Theatre", "Coffee", "Puns"],
    verification: "pending",
    updatedHoursAgo: 6,
  }),
  createProfile({
    id: "demo-user-004",
    username: "leo",
    displayName: "Leo Andrade",
    bio: "Creative coder, street photographer, and coffee afficionado.",
    birthdate: "1990-04-30",
    age: 35,
    gender: "man",
    lookingFor: "women",
    photoUrls: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?auto=format&fit=crop&w=800&q=80",
    ],
    location: { latitude: 34.04, longitude: -118.23 },
    locationText: "Downtown LA",
    interests: ["Coding", "Street photography", "Espresso"],
    verification: "verified",
    updatedHoursAgo: 10,
  }),
  createProfile({
    id: "demo-user-005",
    username: "sasha",
    displayName: "Sasha Rivera",
    bio: "Wellness writer, part-time DJ, full-time optimist.",
    birthdate: "1996-01-17",
    age: 29,
    gender: "nonbinary",
    lookingFor: "everyone",
    photoUrls: [
      "https://images.unsplash.com/photo-1524504388940-1c5027c7f1c9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=800&q=80",
    ],
    location: { latitude: 34.08, longitude: -118.37 },
    locationText: "Hollywood Hills",
    interests: ["Wellness", "Music", "Writing"],
    verification: "unverified",
    updatedHoursAgo: 14,
  }),
  createProfile({
    id: "demo-user-006",
    username: "ari",
    displayName: "Ari Watanabe",
    bio: "Food stylist crafting the perfect bite and the perfect playlist.",
    birthdate: "1992-07-02",
    age: 33,
    gender: "woman",
    lookingFor: "everyone",
    photoUrls: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
    ],
    location: { latitude: 34.18, longitude: -118.4 },
    locationText: "Studio City",
    interests: ["Food", "Playlists", "Travel"],
    verification: "verified",
    updatedHoursAgo: 3,
  }),
];

const feedPosts = demoProfiles.slice(1).map<FeedResponse["posts"][number]>((profile, index) => ({
  id: `demo-post-${index + 1}`,
  user_id: profile.user_id,
  photo_url: profile.photos[0]?.url ?? "",
  caption: profile.bio,
  location: profile.location,
  created_at: hoursAgo((index + 1) * 5),
  profile,
}));

export const demoFeed: FeedResponse = {
  posts: feedPosts,
  cursor: null,
};

function makeMatchSummary(profile: Profile, offsetHours: number, threadId: string): MatchSummary {
  const match: Match = {
    id: `demo-match-${profile.user_id}`,
    user_a: demoProfile.user_id,
    user_b: profile.user_id,
    created_at: hoursAgo(offsetHours),
    matched_at: hoursAgo(offsetHours),
    last_message_at: hoursAgo(offsetHours - 1),
  };
  return {
    id: match.id,
    profile,
    match,
    compatibilityScore: 82 - offsetHours,
    lastInteractionAt: hoursAgo(offsetHours - 1),
    lastMessagePreview: "Can't wait for our rooftop shoot tonight!",
    threadId,
  };
}

function makeHeart(profile: Profile, status: "incoming" | "outgoing", hours: number): LikeSummary {
  const heart: Heart = {
    id: `demo-heart-${profile.user_id}`,
    post_id: `demo-post-${profile.user_id}`,
    from_user: status === "incoming" ? profile.user_id : demoProfile.user_id,
    to_user: status === "incoming" ? demoProfile.user_id : profile.user_id,
    kind: status === "incoming" ? "normal" : "big",
    paid: status === "outgoing",
    message: status === "incoming" ? "You seem like sunshine!" : "Thought of you when I saw this mural",
    selfie_url: status === "incoming"
      ? profile.photos[0]?.url ?? null
      : demoProfile.photos[0]?.url ?? null,
    created_at: hoursAgo(hours),
    post: {
      id: `demo-post-${profile.user_id}`,
      user_id: profile.user_id,
      photo_url: profile.photos[0]?.url ?? "",
      caption: profile.bio,
      location: profile.location,
      created_at: hoursAgo(hours + 2),
      profile,
    },
    profile,
  };

  return {
    id: heart.id,
    profile,
    heart,
    compatibilityScore: status === "incoming" ? 79 : 84,
    receivedAt: hoursAgo(hours),
    status,
  };
}

export const demoMatches: MatchSummary[] = [
  makeMatchSummary(demoProfiles[1], 8, "demo-thread-1"),
  makeMatchSummary(demoProfiles[2], 18, "demo-thread-2"),
  makeMatchSummary(demoProfiles[4], 26, "demo-thread-3"),
];

export const demoIncomingLikes: LikeSummary[] = [
  makeHeart(demoProfiles[3], "incoming", 6),
  makeHeart(demoProfiles[5], "incoming", 15),
];

export const demoOutgoingLikes: LikeSummary[] = [
  makeHeart(demoProfiles[2], "outgoing", 20),
  makeHeart(demoProfiles[4], "outgoing", 28),
];

export const demoNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    kind: "match",
    title: "You and Miles are a perfect match",
    body: "Swap your best portraits to plan the first shoot together.",
    createdAt: hoursAgo(3),
    read: false,
    actionUrl: "/matches",
  },
  {
    id: "notif-2",
    kind: "message",
    title: "Noor sent a new message",
    body: "Let's compare our favorite rooftop spots tonight.",
    createdAt: hoursAgo(5),
    read: false,
    actionUrl: "/chat?thread=demo-thread-2",
  },
  {
    id: "notif-3",
    kind: "system",
    title: "Weekly vibe check",
    body: "Update your profile with a fresh gallery to boost visibility by 3x.",
    createdAt: hoursAgo(22),
    read: true,
  },
  {
    id: "notif-4",
    kind: "safety",
    title: "Safety tip",
    body: "Always arrange first meets in public, well-lit spaces and share details with a friend.",
    createdAt: daysAgo(2),
    read: true,
  },
];

export const demoChatThreads: ChatThread[] = [
  {
    id: "demo-thread-1",
    partner: demoProfiles[1],
    matchId: demoMatches[0].id,
    createdAt: hoursAgo(30),
    unreadCount: 1,
    lastMessage: {
      id: "demo-msg-5",
      threadId: "demo-thread-1",
      senderId: demoProfiles[1].user_id,
      body: "Sending over a location pin now!",
      sentAt: hoursAgo(1.2),
      seenAt: null,
      isMine: false,
    },
  },
  {
    id: "demo-thread-2",
    partner: demoProfiles[2],
    matchId: demoMatches[1].id,
    createdAt: hoursAgo(60),
    unreadCount: 0,
    lastMessage: {
      id: "demo-msg-9",
      threadId: "demo-thread-2",
      senderId: demoProfile.user_id,
      body: "I'll bring the prism lens!",
      sentAt: hoursAgo(4),
      seenAt: hoursAgo(3.5),
      isMine: true,
    },
  },
  {
    id: "demo-thread-3",
    partner: demoProfiles[4],
    matchId: demoMatches[2].id,
    createdAt: hoursAgo(72),
    unreadCount: 2,
    lastMessage: {
      id: "demo-msg-12",
      threadId: "demo-thread-3",
      senderId: demoProfiles[4].user_id,
      body: "I've shared my favorite color palettes.",
      sentAt: hoursAgo(2.5),
      seenAt: null,
      isMine: false,
    },
  },
];

export const demoChatMessages: Record<string, Array<Omit<ChatMessage, "isMine">>> = {
  "demo-thread-1": [
    {
      id: "demo-msg-1",
      threadId: "demo-thread-1",
      senderId: demoProfile.user_id,
      body: "Found a neon alley we should shoot at!",
      sentAt: hoursAgo(6),
    },
    {
      id: "demo-msg-2",
      threadId: "demo-thread-1",
      senderId: demoProfiles[1].user_id,
      body: "Amazing, can you send me a preview?",
      sentAt: hoursAgo(5.7),
    },
    {
      id: "demo-msg-3",
      threadId: "demo-thread-1",
      senderId: demoProfile.user_id,
      body: "Just uploaded it to the shared board.",
      sentAt: hoursAgo(4.1),
    },
    {
      id: "demo-msg-4",
      threadId: "demo-thread-1",
      senderId: demoProfiles[1].user_id,
      body: "Perfection. Meeting at 7pm?",
      sentAt: hoursAgo(3.8),
    },
    {
      id: "demo-msg-5",
      threadId: "demo-thread-1",
      senderId: demoProfiles[1].user_id,
      body: "Sending over a location pin now!",
      sentAt: hoursAgo(1.2),
    },
  ],
  "demo-thread-2": [
    {
      id: "demo-msg-6",
      threadId: "demo-thread-2",
      senderId: demoProfiles[2].user_id,
      body: "Your last portrait set was stunning!",
      sentAt: hoursAgo(9),
    },
    {
      id: "demo-msg-7",
      threadId: "demo-thread-2",
      senderId: demoProfile.user_id,
      body: "Thank you! Want to do a golden hour swap?",
      sentAt: hoursAgo(8.5),
    },
    {
      id: "demo-msg-8",
      threadId: "demo-thread-2",
      senderId: demoProfiles[2].user_id,
      body: "Absolutely, Friday works?",
      sentAt: hoursAgo(7.9),
    },
    {
      id: "demo-msg-9",
      threadId: "demo-thread-2",
      senderId: demoProfile.user_id,
      body: "I'll bring the prism lens!",
      sentAt: hoursAgo(4),
    },
  ],
  "demo-thread-3": [
    {
      id: "demo-msg-10",
      threadId: "demo-thread-3",
      senderId: demoProfile.user_id,
      body: "Have you tried the new immersive gallery downtown?",
      sentAt: hoursAgo(12),
    },
    {
      id: "demo-msg-11",
      threadId: "demo-thread-3",
      senderId: demoProfiles[4].user_id,
      body: "Yes! Let's recreate that mirrored shot.",
      sentAt: hoursAgo(9.5),
    },
    {
      id: "demo-msg-12",
      threadId: "demo-thread-3",
      senderId: demoProfiles[4].user_id,
      body: "I've shared my favorite color palettes.",
      sentAt: hoursAgo(2.5),
    },
  ],
};
