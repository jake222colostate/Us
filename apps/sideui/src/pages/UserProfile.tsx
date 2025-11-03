import { useState } from "react";
import { useParams } from "react-router-dom";

import type { ApiError } from "../api/client";
import { normalizeError } from "../api/client";

import FeedCard from "../components/FeedCard";
import { useProfile } from "../hooks/useProfile";
import { useUserProfile } from "../hooks/useUserProfile";
import { useFeed } from "../hooks/useFeed";

export default function UserProfile() {
  const params = useParams<{ id: string }>();
  const { profile: currentUser } = useProfile();
  const { profile, limitedProfile, canViewFullProfile, unlockReason, loading, error, unlock } = useUserProfile(
    params.id,
  );
  const { reactToPost } = useFeed({ autoLoad: false });
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<ApiError | null>(null);

  const displayedProfile = profile ?? limitedProfile;

  async function handleUnlock() {
    if (unlocking) return;
    setUnlockError(null);
    try {
      setUnlocking(true);
      await unlock();
    } catch (err) {
      setUnlockError(normalizeError(err));
    } finally {
      setUnlocking(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-card" aria-busy="true">
          <p className="text-muted">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!displayedProfile) {
    return (
      <div className="page">
        <div className="page-card">
          <h1>Profile unavailable</h1>
          <p className="text-muted">We couldn’t find this user. They may have gone offline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>{displayedProfile.display_name}</h1>
        <p className="text-muted">
          {displayedProfile.bio ?? "Ready to collaborate and compare shots."}
        </p>
      </header>

      <FeedCard
        post={{
          id: `profile-${displayedProfile.user_id}`,
          user_id: displayedProfile.user_id,
          photo_url: displayedProfile.photo_urls[0],
          caption: displayedProfile.bio,
          location: displayedProfile.location,
          created_at: displayedProfile.updated_at,
          profile: displayedProfile,
        }}
        currentUser={currentUser}
        onReact={reactToPost}
      />

      {!canViewFullProfile ? (
        <div className="page-card page-card--muted">
          <h2>Unlock the full profile</h2>
          <p className="text-muted">
            {unlockReason === "none"
              ? "Purchase access to see their full gallery and compare photos."
              : "A purchase is required to unlock this profile."}
          </p>
          <div className="hero-card__cta">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleUnlock}
              disabled={unlocking}
            >
              {unlocking ? "Unlocking…" : "Unlock profile"}
            </button>
            <span className="text-small text-muted">
              Includes unlimited comparisons even before you match.
            </span>
          </div>
          {unlockError ? <div className="alert alert--error">{unlockError.message}</div> : null}
        </div>
      ) : null}

      {canViewFullProfile && limitedProfile && profile === null ? (
        <div className="page-card page-card--muted">
          <p className="text-muted">
            Full profile unlocked. Refresh to load the latest gallery if it doesn’t appear instantly.
          </p>
        </div>
      ) : null}

      {error ? <div className="alert alert--error">{error.message}</div> : null}
    </div>
  );
}
