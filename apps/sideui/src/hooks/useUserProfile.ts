import { useCallback, useEffect, useMemo, useState } from "react";
import type { Profile } from "@us/types";

import { ENABLE_DEMO_DATA } from "../config";
import { demoProfiles } from "../lib/demo-data";
import { ApiError, normalizeError } from "../api/client";
import { fetchProfileById } from "../api/profile";
import { getSupabaseClient } from "../api/supabase";

export function useUserProfile(userId: string | undefined) {
  const supabase = getSupabaseClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(userId));
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (!supabase) {
      if (ENABLE_DEMO_DATA) {
        const demo = demoProfiles.find((item) => item.user_id === userId) ?? demoProfiles[1] ?? null;
        setProfile(demo ?? null);
        setError(null);
      } else {
        setError(new ApiError("Supabase client is not configured", 503, null));
        setProfile(null);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const fetched = await fetchProfileById(userId);
      if (fetched) {
        setProfile(fetched);
        setError(null);
      } else if (ENABLE_DEMO_DATA) {
        const demo = demoProfiles.find((item) => item.user_id === userId) ?? demoProfiles[1] ?? null;
        setProfile(demo ?? null);
      } else {
        setProfile(null);
        setError(new ApiError("Profile not found", 404, null));
      }
    } catch (err) {
      const apiErr = normalizeError(err);
      if (ENABLE_DEMO_DATA) {
        const demo = demoProfiles.find((item) => item.user_id === userId) ?? demoProfiles[1] ?? null;
        setProfile(demo ?? null);
      }
      setError(apiErr);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(() => ({ profile, loading, error, refetch: load }), [profile, loading, error, load]);
}
