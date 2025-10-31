import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Profile } from "@us/types";

import { ENABLE_DEMO_DATA } from "../config";
import { demoProfile } from "../lib/demo-data";
import type { UpdateProfilePayload } from "../types";
import { useAuth } from "../auth";
import { ApiError, normalizeError } from "../api/client";
import { fetchProfile as fetchProfileApi, updateProfile as updateProfileApi } from "../api/profile";
import { getSupabaseClient } from "../api/supabase";

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  error: ApiError | null;
  refresh: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<Profile>;
  setProfile: (profile: Profile | null) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseClient();
  const { user, loading: authLoading, setAuthUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const syncAuthProfile = useCallback(
    (nextProfile: Profile | null) => {
      if (!nextProfile) {
        setAuthUser(null);
        return;
      }
      setAuthUser({
        id: nextProfile.user_id,
        email: user?.email ?? "user@us.app",
        displayName: nextProfile.display_name,
        avatarUrl: nextProfile.photo_urls?.[0] ?? null,
      });
    },
    [setAuthUser, user?.email]
  );

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (!supabase) {
      if (ENABLE_DEMO_DATA) {
        setProfile(demoProfile);
        syncAuthProfile(demoProfile);
        setError(null);
      } else {
        const unavailable = new ApiError("Supabase client is not configured", 503, null);
        setError(unavailable);
        setProfile(null);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const fetched = await fetchProfileApi(user.id);
      if (fetched) {
        setProfile(fetched);
        syncAuthProfile(fetched);
        setError(null);
      } else if (ENABLE_DEMO_DATA) {
        setProfile(demoProfile);
        syncAuthProfile(demoProfile);
      } else {
        const notFound = new ApiError("Profile not found", 404, null);
        setError(notFound);
        setProfile(null);
      }
    } catch (err) {
      const apiErr = normalizeError(err);
      if (ENABLE_DEMO_DATA) {
        setProfile(demoProfile);
        syncAuthProfile(demoProfile);
      } else {
        setProfile(null);
      }
      setError(apiErr);
    } finally {
      setLoading(false);
    }
  }, [user, supabase, syncAuthProfile]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    void loadProfile();
  }, [authLoading, user, loadProfile]);

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload) => {
      if (!user) {
        throw new ApiError("Not authenticated", 401, null);
      }

      if (!supabase) {
        if (ENABLE_DEMO_DATA && profile) {
          const merged: Profile = {
            ...profile,
            ...payload,
            photo_urls: payload.photo_urls ?? profile.photo_urls,
          } as Profile;
          setProfile(merged);
          syncAuthProfile(merged);
          return merged;
        }
        throw new ApiError("Supabase client is not configured", 503, null);
      }

      try {
        const updated = await updateProfileApi(user.id, payload);
        setProfile(updated);
        syncAuthProfile(updated);
        setError(null);
        return updated;
      } catch (err) {
        const apiErr = normalizeError(err);
        setError(apiErr);
        if (ENABLE_DEMO_DATA && profile) {
          const merged: Profile = {
            ...profile,
            ...payload,
            photo_urls: payload.photo_urls ?? profile.photo_urls,
          } as Profile;
          setProfile(merged);
          syncAuthProfile(merged);
          return merged;
        }
        throw apiErr;
      }
    },
    [user, supabase, profile, syncAuthProfile]
  );

  const value = useMemo<ProfileContextValue>(
    () => ({ profile, loading, error, refresh: loadProfile, updateProfile, setProfile }),
    [profile, loading, error, loadProfile, updateProfile]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
}
