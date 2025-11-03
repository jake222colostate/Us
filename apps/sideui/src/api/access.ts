import type { ProfileAccess, RewardSpinResult, RewardStatus } from "@us/types";

import { ApiError, normalizeError } from "./client";
import { requireSupabaseClient } from "./supabase";

export async function fetchProfileAccess(targetUserId: string): Promise<ProfileAccess> {
  const client = requireSupabaseClient();
  try {
    const { data, error } = await client.functions.invoke<ProfileAccess>("profile-access", {
      body: { target_user_id: targetUserId },
    });
    if (error) {
      throw normalizeError(error, 400);
    }
    if (!data) {
      throw new ApiError("Profile not found", 404, null);
    }
    return data;
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error, 500);
  }
}

export async function unlockProfile(targetUserId: string): Promise<ProfileAccess> {
  const client = requireSupabaseClient();
  try {
    const { data, error } = await client.functions.invoke<ProfileAccess>("profile-unlock", {
      body: { target_user_id: targetUserId },
    });
    if (error) {
      throw normalizeError(error, 400);
    }
    if (!data) {
      throw new ApiError("Unable to unlock profile", 400, null);
    }
    return data;
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error, 500);
  }
}

export async function fetchRewardsStatus(): Promise<RewardStatus> {
  const client = requireSupabaseClient();
  try {
    const { data, error } = await client.functions.invoke<RewardStatus>("rewards-status", {
      method: "GET",
    });
    if (error) {
      throw normalizeError(error, 400);
    }
    if (!data) {
      throw new ApiError("Unable to load rewards", 400, null);
    }
    return data;
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error, 500);
  }
}

export async function spinRewardsFree(): Promise<RewardSpinResult> {
  const client = requireSupabaseClient();
  try {
    const { data, error } = await client.functions.invoke<RewardSpinResult>("rewards-spin", {
      body: {},
    });
    if (error) {
      throw normalizeError(error, 400);
    }
    if (!data) {
      throw new ApiError("Spin failed", 400, null);
    }
    return data;
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error, 500);
  }
}

export async function spinRewardsPaid(): Promise<RewardSpinResult> {
  const client = requireSupabaseClient();
  try {
    const { data, error } = await client.functions.invoke<RewardSpinResult>("rewards-spin-paid", {
      body: {},
    });
    if (error) {
      throw normalizeError(error, 400);
    }
    if (!data) {
      throw new ApiError("Spin failed", 400, null);
    }
    return data;
  } catch (error) {
    throw error instanceof ApiError ? error : normalizeError(error, 500);
  }
}
