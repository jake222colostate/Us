import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { RewardStatus } from "@us/types";

import { useProfile } from "../hooks/useProfile";
import { formatDate, formatRelativeTime } from "../lib/format";
import { fetchRewardsStatus, spinRewardsFree, spinRewardsPaid } from "../api/access";
import { getSupabaseClient } from "../api/supabase";
import { ENABLE_DEMO_DATA } from "../config";
import { ApiError, normalizeError } from "../api/client";
import { useToast } from "../hooks/use-toast";

export default function Profile() {
  const { profile, loading } = useProfile();
  const supabase = getSupabaseClient();
  const { push } = useToast();
  const [rewardsStatus, setRewardsStatus] = useState<RewardStatus | null>(null);
  const [rewardsLoading, setRewardsLoading] = useState<boolean>(Boolean(supabase));
  const [spinLoading, setSpinLoading] = useState<"free" | "paid" | null>(null);
  const [rewardsError, setRewardsError] = useState<ApiError | null>(null);

  const loadRewards = useCallback(async () => {
    if (!supabase) {
      if (ENABLE_DEMO_DATA) {
        const now = new Date();
        const demo: RewardStatus = {
          free_available: true,
          next_free_spin_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          last_spin: null,
          active_bonuses: [],
        };
        setRewardsStatus(demo);
        setRewardsError(null);
      } else {
        setRewardsError(new ApiError("Supabase client is not configured", 503, null));
      }
      setRewardsLoading(false);
      return;
    }

    setRewardsLoading(true);
    try {
      const status = await fetchRewardsStatus();
      setRewardsStatus(status);
      setRewardsError(null);
    } catch (err) {
      const apiErr = normalizeError(err);
      setRewardsError(apiErr);
    } finally {
      setRewardsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadRewards();
  }, [loadRewards]);

  const handleSpin = useCallback(
    async (type: "free" | "paid") => {
      if (!supabase && !ENABLE_DEMO_DATA) {
        push({ title: "Spin unavailable", description: "Connect to Supabase to spin.", variant: "error" });
        return;
      }
      setSpinLoading(type);
      setRewardsError(null);
      try {
        if (!supabase && ENABLE_DEMO_DATA) {
          const now = new Date();
          const result: RewardStatus = {
            free_available: type === "paid", // free consumed
            next_free_spin_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            last_spin: {
              spin_type: type,
              reward_type: type === "free" ? "boost" : "extra_like",
              reward_value: {},
              spin_at: now.toISOString(),
            },
            active_bonuses: [
              {
                bonus_type: type === "free" ? "boost" : "extra_like",
                quantity: 1,
                expires_at: type === "free" ? new Date(now.getTime() + 60 * 60 * 1000).toISOString() : null,
              },
            ],
          };
          setRewardsStatus(result);
          push({
            title: type === "free" ? "Boost unlocked" : "Bonus like added",
            description: "Demo reward applied.",
            variant: "success",
          });
          return;
        }

        const spinResult = type === "free" ? await spinRewardsFree() : await spinRewardsPaid();
        setRewardsStatus(spinResult.status);
        push({
          title: `Reward: ${spinResult.reward.reward_label}`,
          description: "Check your boosts in the feed!",
          variant: "success",
        });
      } catch (err) {
        const apiErr = normalizeError(err);
        setRewardsError(apiErr);
        push({ title: "Spin failed", description: apiErr.message, variant: "error" });
      } finally {
        setSpinLoading(null);
      }
    },
    [supabase, push],
  );

  const nextSpinText = useMemo(() => {
    if (!rewardsStatus) return null;
    if (rewardsStatus.free_available) {
      return "Free spin available now";
    }
    return `Next free spin ${formatRelativeTime(rewardsStatus.next_free_spin_at)}`;
  }, [rewardsStatus]);

  if (loading && !profile) {
    return (
      <div className="page">
        <div className="page-card" aria-busy="true">
          <p className="text-muted">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page">
        <div className="page-card">
          <h1>No profile yet</h1>
          <p className="text-muted">Complete onboarding to unlock your personalized feed.</p>
          <Link to="/onboarding" className="btn btn--primary">
            Start onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>{profile.display_name}</h1>
        <p className="text-muted">
          Member since {formatDate(profile.created_at)} · Last updated {formatRelativeTime(profile.updated_at)}
        </p>
        <div className="hero-card__cta">
          <Link to="/profile/edit" className="btn btn--secondary">
            Edit profile
          </Link>
          <Link to="/settings" className="btn btn--ghost">
            Discovery settings
          </Link>
        </div>
      </header>

      <section className="page-card">
        <h2>About</h2>
        <p className="text-muted">{profile.bio ?? "Tell others what inspires your photography."}</p>
        <div className="tag-list">
          {profile.gender ? <span className="tag">{profile.gender}</span> : null}
          {profile.looking_for ? <span className="tag">Looking for {profile.looking_for}</span> : null}
          <span className="tag">Radius {profile.radius_km} km</span>
        </div>
      </section>

      <section className="page-card">
        <h2>Gallery</h2>
        <div className="photo-grid">
          {profile.photo_urls.map((url, index) => (
            <figure key={url}>
              <img src={url} alt={`Gallery item ${index + 1}`} loading="lazy" />
              <figcaption>Shot #{index + 1}</figcaption>
            </figure>
          ))}
          {profile.photo_urls.length === 0 ? (
            <div className="feed-empty">No photos yet. Add at least one to shine in the feed.</div>
          ) : null}
        </div>
      </section>

      <section className="page-card">
        <h2>Daily spin rewards</h2>
        <p className="text-muted">
          Earn boosts, highlights, and bonus likes every day. Free spins refresh every 24 hours.
        </p>
        {rewardsError ? <div className="alert alert--error">{rewardsError.message}</div> : null}
        <div className="hero-card__cta">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => handleSpin("free")}
            disabled={spinLoading !== null || rewardsLoading || !rewardsStatus?.free_available}
          >
            {spinLoading === "free" ? "Spinning…" : rewardsStatus?.free_available ? "Spin free" : "Free spin used"}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => handleSpin("paid")}
            disabled={spinLoading !== null || rewardsLoading}
          >
            {spinLoading === "paid" ? "Charging…" : "Spin for $1"}
          </button>
        </div>
        <div className="text-muted text-small">{nextSpinText}</div>
        {rewardsLoading ? <p className="text-muted">Loading rewards…</p> : null}
        {rewardsStatus?.active_bonuses?.length ? (
          <ul className="text-small">
            {rewardsStatus.active_bonuses.map((bonus, index) => (
              <li key={`${bonus.bonus_type}-${index}`}>
                {bonus.bonus_type} ·
                {bonus.expires_at ? ` expires ${formatRelativeTime(bonus.expires_at)}` : " no expiration"}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-small text-muted">No active boosts yet. Spin to collect one!</p>
        )}
      </section>
    </div>
  );
}
