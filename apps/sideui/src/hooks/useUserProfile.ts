import { useCallback, useEffect, useMemo, useState } from "react";
import type { Profile, ProfileAccess, ProfileUnlockReason } from "@us/types";

import { ENABLE_DEMO_DATA } from "../config";
import { demoProfiles } from "../lib/demo-data";
import { ApiError, normalizeError } from "../api/client";
import { fetchProfileAccess, unlockProfile } from "../api/access";
import { getSupabaseClient } from "../api/supabase";

type UseUserProfileState = {
  profile: Profile | null;
  limitedProfile: Profile | null;
  canViewFullProfile: boolean;
  unlockReason: ProfileUnlockReason;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  unlock: () => Promise<ProfileAccess>;
};

export function useUserProfile(userId: string | undefined): UseUserProfileState {
  const supabase = getSupabaseClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [limitedProfile, setLimitedProfile] = useState<Profile | null>(null);
  const [canViewFullProfile, setCanViewFullProfile] = useState<boolean>(true);
  const [unlockReason, setUnlockReason] = useState<ProfileUnlockReason>("self");
  const [loading, setLoading] = useState<boolean>(Boolean(userId));
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLimitedProfile(null);
      setCanViewFullProfile(false);
      setUnlockReason("none");
      setLoading(false);
      return;
    }

    if (!supabase) {
      if (ENABLE_DEMO_DATA) {
        const demo = demoProfiles.find((item) => item.user_id === userId) ?? demoProfiles[1] ?? null;
        setProfile(demo ?? null);
        setLimitedProfile(demo ?? null);
        setCanViewFullProfile(true);
        setUnlockReason("self");
        setError(null);
      } else {
        setError(new ApiError("Supabase client is not configured", 503, null));
        setProfile(null);
        setLimitedProfile(null);
        setCanViewFullProfile(false);
        setUnlockReason("none");
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const access = await fetchProfileAccess(userId);
      setProfile(access.profile);
      setLimitedProfile(access.limited_profile);
      setCanViewFullProfile(access.can_view_full_profile);
      setUnlockReason(access.unlock_reason);
      setError(null);
    } catch (err) {
      const apiErr = normalizeError(err);
      if (ENABLE_DEMO_DATA) {
        const demo = demoProfiles.find((item) => item.user_id === userId) ?? demoProfiles[1] ?? null;
        setProfile(demo ?? null);
        setLimitedProfile(demo ?? null);
        setCanViewFullProfile(true);
        setUnlockReason("self");
      }
      setError(apiErr);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  const unlock = useCallback(async () => {
    if (!userId) {
      throw new ApiError("Profile unavailable", 404, null);
    }
    if (!supabase) {
      if (ENABLE_DEMO_DATA) {
        const demo = demoProfiles.find((item) => item.user_id === userId) ?? demoProfiles[1] ?? null;
        setProfile(demo ?? null);
        setLimitedProfile(demo ?? null);
        setCanViewFullProfile(true);
        setUnlockReason("self");
        return {
          profile: demo ?? null,
          limited_profile: demo ?? null,
          can_view_full_profile: true,
          unlock_reason: "self",
          access_expires_at: null,
        };
      }
      throw new ApiError("Supabase client is not configured", 503, null);
    }

    try {
      const access = await unlockProfile(userId);
      setProfile(access.profile);
      setLimitedProfile(access.limited_profile);
      setCanViewFullProfile(access.can_view_full_profile);
      setUnlockReason(access.unlock_reason);
      setError(null);
      return access;
    } catch (err) {
      const apiErr = normalizeError(err);
      setError(apiErr);
      throw apiErr;
    }
  }, [userId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(
    () => ({
      profile,
      limitedProfile,
      canViewFullProfile,
      unlockReason,
      loading,
      error,
      refetch: load,
      unlock,
    }),
    [profile, limitedProfile, canViewFullProfile, unlockReason, loading, error, load, unlock],
  );
}
