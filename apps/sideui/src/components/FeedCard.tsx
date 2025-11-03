import { useCallback, useMemo, useState } from "react";
import type { Post, Profile } from "@us/types";

import { formatRelativeTime, formatDistanceKm } from "../lib/format";
import SideBySideModal from "./SideBySideModal";

import "./FeedCard.css";

interface FeedCardProps {
  post: Post;
  currentUser?: Profile | null;
  onReact?: (postId: string, action: "like" | "superlike" | "pass") => Promise<void> | void;
}

function computeAge(birthdate?: string | null) {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) return null;
  const diff = Date.now() - birth.getTime();
  const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return age;
}

export default function FeedCard({ post, currentUser, onReact }: FeedCardProps) {
  const [isComparing, setIsComparing] = useState(false);
  const [pendingAction, setPendingAction] = useState<"like" | "superlike" | "pass" | null>(null);

  const profile = post.profile;
  const age = computeAge(profile?.birthdate);
  const distance = profile?.location && currentUser?.location
    ? formatDistanceKm(
        Math.hypot(
          profile.location.latitude - currentUser.location.latitude,
          profile.location.longitude - currentUser.location.longitude
        ) * 111
      )
    : formatDistanceKm(profile?.radius_km ?? null);

  const compatibilityHint = useMemo(() => {
    if (!profile?.looking_for || !currentUser?.looking_for) return null;
    if (profile.looking_for === "everyone" && currentUser.looking_for === "everyone") return "Open to everyone";
    if (profile.looking_for === currentUser.gender) return "Mutual preferences align";
    return null;
  }, [profile?.looking_for, currentUser?.looking_for, currentUser?.gender]);

  const createdAtText = formatRelativeTime(post.created_at);
  const currentPhoto = currentUser?.photos?.find((photo) => photo.is_primary)?.url
    ?? currentUser?.photos?.[0]?.url
    ?? "https://api.dicebear.com/7.x/thumbs/svg?seed=You";
  const matchPhoto = post.photo_url;

  const handleReact = useCallback(
    async (action: "like" | "superlike" | "pass") => {
      if (!onReact) return;
      try {
        setPendingAction(action);
        await onReact(post.id, action);
      } finally {
        setPendingAction(null);
      }
    },
    [onReact, post.id]
  );

  return (
    <article className="feed-card">
      <figure className="feed-card__photo">
        <img src={matchPhoto} alt={`${profile?.display_name ?? "Potential match"} portrait`} loading="lazy" />
        <figcaption>
          <span className="feed-card__name">{profile?.display_name ?? "Potential match"}</span>
          {age ? <span className="feed-card__age">{age}</span> : null}
        </figcaption>
      </figure>
      <div className="feed-card__body">
        <div className="feed-card__meta">
          {distance ? <span className="badge">{distance} away</span> : null}
          <span className="text-muted text-small">Updated {createdAtText}</span>
        </div>
        <p className="feed-card__bio">{post.caption ?? profile?.bio ?? "Say hi and share your favorite photo spot."}</p>
        <div className="feed-card__tags">
          {profile?.looking_for ? <span className="tag">Looking for {profile.looking_for}</span> : null}
          {compatibilityHint ? <span className="tag">{compatibilityHint}</span> : null}
        </div>
        <div className="feed-card__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => handleReact("pass")}
            disabled={pendingAction !== null}
          >
            Pass
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => handleReact("like")}
            disabled={pendingAction !== null}
          >
            Send like
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => handleReact("superlike")}
            disabled={pendingAction !== null}
          >
            Big like
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setIsComparing(true)}>
            Compare photos
          </button>
        </div>
      </div>
      <SideBySideModal
        open={isComparing}
        onClose={() => setIsComparing(false)}
        left={{
          title: currentUser?.display_name ?? "You",
          subtitle: "Your latest upload",
          imageUrl: currentPhoto,
        }}
        right={{
          title: profile?.display_name ?? "Potential match",
          subtitle: profile?.bio ?? "",
          imageUrl: matchPhoto,
        }}
      />
    </article>
  );
}
