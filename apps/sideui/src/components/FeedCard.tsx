import { useCallback, useEffect, useMemo, useState } from "react";
import type { Post, Profile } from "@us/types";

import { formatRelativeTime, formatDistanceKm } from "../lib/format";
import { getLookingForLabel } from "../lib/profile";
import SideBySideModal from "./SideBySideModal";
import { fetchProfileAccess, unlockProfile } from "../api/access";
import { getSupabaseClient } from "../api/supabase";
import { ENABLE_DEMO_DATA } from "../config";
import { ApiError, normalizeError } from "../api/client";
import { useToast } from "../hooks/use-toast";

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
  const [accessChecking, setAccessChecking] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [accessError, setAccessError] = useState<ApiError | null>(null);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const supabase = getSupabaseClient();
  const { push } = useToast();

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
    if (profile.looking_for === currentUser.looking_for && profile.looking_for === "nonbinary") return "You both prefer they/them matches";
    return null;
  }, [profile?.looking_for, currentUser?.looking_for, currentUser?.gender]);

  const lookingForLabel = getLookingForLabel(profile?.looking_for);

  const createdAtText = formatRelativeTime(post.created_at);
  const currentPhoto = currentUser?.photos?.find((photo) => photo.is_primary)?.url
    ?? currentUser?.photos?.[0]?.url
    ?? "https://api.dicebear.com/7.x/thumbs/svg?seed=You";
  const matchPhoto = post.photo_url;

  useEffect(() => {
    setHasFullAccess(false);
    setAccessError(null);
    setAccessChecking(false);
    setUnlocking(false);
  }, [profile?.user_id]);

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

  const ensureAccess = useCallback(async () => {
    if (!profile?.user_id) return false;
    if (!supabase) {
      if (ENABLE_DEMO_DATA) {
        setHasFullAccess(true);
        return true;
      }
      setAccessError(new ApiError("Supabase client is not configured", 503, null));
      return false;
    }
    setAccessChecking(true);
    setAccessError(null);
    try {
      const access = await fetchProfileAccess(profile.user_id);
      setHasFullAccess(access.can_view_full_profile);
      if (access.can_view_full_profile) {
        return true;
      }
      setAccessError(new ApiError("Unlock required", 403, access));
      return false;
    } catch (err) {
      const apiErr = normalizeError(err);
      setAccessError(apiErr);
      return false;
    } finally {
      setAccessChecking(false);
    }
  }, [profile?.user_id, supabase]);

  const handleCompare = useCallback(async () => {
    if (!profile?.user_id) return;
    const allowed = await ensureAccess();
    if (allowed) {
      setIsComparing(true);
    }
  }, [ensureAccess, profile?.user_id]);

  const handleUnlockProfile = useCallback(async () => {
    if (!profile?.user_id) return;
    if (!supabase) {
      if (ENABLE_DEMO_DATA) {
        setHasFullAccess(true);
        setAccessError(null);
        setIsComparing(true);
        return;
      }
      setAccessError(new ApiError("Supabase client is not configured", 503, null));
      return;
    }
    setUnlocking(true);
    setAccessError(null);
    try {
      const access = await unlockProfile(profile.user_id);
      if (access.can_view_full_profile) {
        setHasFullAccess(true);
        push({ title: "Profile unlocked", description: "Full gallery available", variant: "success" });
        setIsComparing(true);
      } else {
        setAccessError(new ApiError("Unlock incomplete", 400, access));
      }
    } catch (err) {
      const apiErr = normalizeError(err);
      setAccessError(apiErr);
      push({ title: "Unlock failed", description: apiErr.message, variant: "error" });
    } finally {
      setUnlocking(false);
    }
  }, [profile?.user_id, supabase, push]);

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
          {lookingForLabel ? <span className="tag">Looking for {lookingForLabel}</span> : null}
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
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleCompare}
            disabled={accessChecking || unlocking}
          >
            {accessChecking ? "Checking access…" : "Compare photos"}
          </button>
        </div>
        {accessError ? (
          <div className="alert alert--muted">
            <div>{accessError.message}</div>
            {!hasFullAccess && profile?.user_id ? (
              <div className="feed-card__unlock">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleUnlockProfile}
                  disabled={unlocking}
                >
                  {unlocking ? "Unlocking…" : "Unlock profile"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
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
