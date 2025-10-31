import type { Heart, Match, Profile } from "@us/types";

import { ApiError, normalizeError } from "./client";
import { requireSupabaseClient } from "./supabase";
import { mapHeartRow, mapMatchRow, mapProfileRow } from "./transformers";
import type { LikeSummary, MatchSummary } from "../types";

interface MatchesResult {
  matches: MatchSummary[];
  incomingLikes: LikeSummary[];
  outgoingLikes: LikeSummary[];
}

function buildMatchSummary({
  match,
  partner,
}: {
  match: Match;
  partner: Profile | undefined;
}): MatchSummary | null {
  if (!partner) return null;
  return {
    id: match.id,
    profile: partner,
    match,
    compatibilityScore: null,
    lastInteractionAt: match.created_at,
    lastMessagePreview: null,
    threadId: null,
  };
}

function buildLikeSummary({
  heart,
  profile,
  status,
}: {
  heart: Heart;
  profile: Profile | undefined;
  status: "incoming" | "outgoing";
}): LikeSummary | null {
  if (!profile) return null;
  return {
    id: heart.id,
    profile,
    heart,
    compatibilityScore: null,
    receivedAt: heart.created_at,
    status,
  };
}

export async function fetchMatchesAndLikes(userId: string): Promise<MatchesResult> {
  const client = requireSupabaseClient();

  try {
    const [{ data: matchRows, error: matchesError }, { data: incomingHearts, error: incomingError }, { data: outgoingHearts, error: outgoingError }] = await Promise.all([
      client
        .from("matches")
        .select("*")
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(50),
      client
        .from("hearts")
        .select("*")
        .eq("to_user", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      client
        .from("hearts")
        .select("*")
        .eq("from_user", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (matchesError) throw normalizeError(matchesError, 400);
    if (incomingError) throw normalizeError(incomingError, 400);
    if (outgoingError) throw normalizeError(outgoingError, 400);

    const matchList = Array.isArray(matchRows) ? matchRows : [];
    const incomingList = Array.isArray(incomingHearts) ? incomingHearts : [];
    const outgoingList = Array.isArray(outgoingHearts) ? outgoingHearts : [];

    const profileIds = new Set<string>();
    matchList.forEach((row: any) => {
      const match = mapMatchRow(row);
      const partnerId = match.user_a === userId ? match.user_b : match.user_a;
      profileIds.add(partnerId);
    });
    incomingList.forEach((row: any) => {
      const heart = mapHeartRow(row);
      profileIds.add(heart.from_user);
    });
    outgoingList.forEach((row: any) => {
      const heart = mapHeartRow(row);
      profileIds.add(heart.to_user);
    });

    const ids = Array.from(profileIds);
    let profileMap = new Map<string, Profile>();
    if (ids.length > 0) {
      const { data: profileRows, error: profileError } = await client.from("profiles").select("*").in("user_id", ids);
      if (profileError) {
        throw normalizeError(profileError, 400);
      }
      profileMap = new Map(
        (profileRows ?? []).map((row: any) => {
          const profile = mapProfileRow(row);
          return [profile.user_id, profile] as const;
        })
      );
    }

    const matches = matchList
      .map((row: any) => {
        const match = mapMatchRow(row);
        const partnerId = match.user_a === userId ? match.user_b : match.user_a;
        return buildMatchSummary({ match, partner: profileMap.get(partnerId) });
      })
      .filter((item): item is MatchSummary => Boolean(item));

    const incomingLikes = incomingList
      .map((row: any) => buildLikeSummary({ heart: mapHeartRow(row), profile: profileMap.get(row.from_user), status: "incoming" }))
      .filter((item): item is LikeSummary => Boolean(item));

    const outgoingLikes = outgoingList
      .map((row: any) => buildLikeSummary({ heart: mapHeartRow(row), profile: profileMap.get(row.to_user), status: "outgoing" }))
      .filter((item): item is LikeSummary => Boolean(item));

    return { matches, incomingLikes, outgoingLikes };
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}

export async function respondToLike({
  likeId,
  action,
  currentUserId,
}: {
  likeId: string;
  action: "accept" | "decline";
  currentUserId: string;
}): Promise<void> {
  const client = requireSupabaseClient();
  try {
    const { data: heartRow, error } = await client.from("hearts").select("*").eq("id", likeId).maybeSingle();
    if (error) {
      throw normalizeError(error, 400);
    }
    if (!heartRow) {
      throw new ApiError("Like not found", 404, { likeId });
    }

    if (action === "decline") {
      const { error: deleteError } = await client.from("hearts").delete().eq("id", likeId);
      if (deleteError) {
        throw normalizeError(deleteError, 400);
      }
      return;
    }

    const heart = mapHeartRow(heartRow);
    const partnerId = heart.from_user === currentUserId ? heart.to_user : heart.from_user;
    const [userA, userB] = [currentUserId, partnerId].sort();

    const { error: insertError } = await client
      .from("matches")
      .insert({ user_a: userA, user_b: userB })
      .select("id")
      .maybeSingle();

    if (insertError && !String(insertError.message).toLowerCase().includes("duplicate")) {
      throw normalizeError(insertError, 400);
    }
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error);
  }
}
