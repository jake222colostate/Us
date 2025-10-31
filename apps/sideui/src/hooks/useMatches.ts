import { useCallback, useEffect, useMemo, useState } from "react";

import { ENABLE_DEMO_DATA } from "../config";
import {
  demoIncomingLikes,
  demoMatches,
  demoOutgoingLikes,
} from "../lib/demo-data";
import type { LikeSummary, MatchSummary } from "../types";
import { ApiError, normalizeError } from "../api/client";
import { fetchMatchesAndLikes, respondToLike as respondToLikeApi } from "../api/matches";
import { useAuth } from "../auth";
import { getSupabaseClient } from "../api/supabase";

export function useMatches() {
  const supabase = getSupabaseClient();
  const { user } = useAuth();

  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [incomingLikes, setIncomingLikes] = useState<LikeSummary[]>([]);
  const [outgoingLikes, setOutgoingLikes] = useState<LikeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setMatches([]);
      setIncomingLikes([]);
      setOutgoingLikes([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!supabase) {
      if (ENABLE_DEMO_DATA) {
        setMatches(demoMatches);
        setIncomingLikes(demoIncomingLikes);
        setOutgoingLikes(demoOutgoingLikes);
        setError(null);
      } else {
        setError(new ApiError("Supabase client is not configured", 503, null));
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetchMatchesAndLikes(user.id);
      setMatches(response.matches);
      setIncomingLikes(response.incomingLikes);
      setOutgoingLikes(response.outgoingLikes);
      setError(null);
    } catch (err) {
      const apiErr = normalizeError(err);
      if (ENABLE_DEMO_DATA) {
        if (matches.length === 0 && incomingLikes.length === 0 && outgoingLikes.length === 0) {
          setMatches(demoMatches);
          setIncomingLikes(demoIncomingLikes);
          setOutgoingLikes(demoOutgoingLikes);
        }
      }
      setError(apiErr);
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase, matches.length, incomingLikes.length, outgoingLikes.length]);

  useEffect(() => {
    void load();
  }, [load]);

  const respondToLike = useCallback(
    async (likeId: string, action: "accept" | "decline") => {
      setIncomingLikes((prev) => prev.filter((like) => like.id !== likeId));
      if (!user?.id || !supabase) {
        if (!ENABLE_DEMO_DATA) {
          const unavailable = new ApiError("Supabase client is not configured", 503, null);
          setError(unavailable);
          throw unavailable;
        }
        return;
      }
      try {
        await respondToLikeApi({ likeId, action, currentUserId: user.id });
        if (action === "accept") {
          await load();
        }
      } catch (err) {
        const apiErr = normalizeError(err);
        setError(apiErr);
        if (!ENABLE_DEMO_DATA) {
          throw apiErr;
        }
      }
    },
    [load, user?.id, supabase]
  );

  return useMemo(
    () => ({ matches, incomingLikes, outgoingLikes, loading, error, refetch: load, respondToLike }),
    [matches, incomingLikes, outgoingLikes, loading, error, load, respondToLike]
  );
}
