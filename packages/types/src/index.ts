export type Gender = 'woman' | 'man' | 'nonbinary' | 'other';
export type LookingFor = 'women' | 'men' | 'everyone';

export type Profile = {
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  birthdate: string;
  gender: Gender | null;
  looking_for: LookingFor | null;
  photo_urls: string[];
  location: {
    latitude: number;
    longitude: number;
  } | null;
  radius_km: number;
  preferences?: Record<string, unknown> | null;
  verification_status?: 'none' | 'pending' | 'approved' | 'rejected';
  visibility_score?: number;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  created_at: string;
  profile?: Profile;
};

export type HeartKind = 'normal' | 'big';

export type Heart = {
  id: string;
  post_id: string;
  from_user: string;
  to_user: string;
  kind: HeartKind;
  paid: boolean;
  message: string | null;
  selfie_url: string | null;
  created_at: string;
  post?: Post;
  profile?: Profile;
};

export type Match = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
};

export type ProfileUnlockReason = 'self' | 'match' | 'purchase' | 'none';

export type ProfileAccess = {
  profile: Profile | null;
  limited_profile: Profile | null;
  can_view_full_profile: boolean;
  unlock_reason: ProfileUnlockReason;
  access_expires_at: string | null;
};

export type RewardSpinRecord = {
  id?: string;
  user_id?: string;
  spin_type: 'free' | 'paid';
  reward_type: string;
  reward_value: Record<string, unknown>;
  spin_at?: string;
  created_at?: string;
};

export type RewardStatus = {
  free_available: boolean;
  next_free_spin_at: string;
  last_spin: RewardSpinRecord | null;
  active_bonuses: Array<{
    id?: string;
    bonus_type: string;
    quantity?: number;
    expires_at?: string | null;
    metadata?: Record<string, unknown>;
  }>;
};

export type RewardSpinResult = {
  spin_type: 'free' | 'paid';
  reward: {
    reward_type: string;
    reward_label: string;
    reward_value: Record<string, unknown>;
  };
  status: RewardStatus;
};

export type PurchaseProvider = 'apple' | 'google' | 'stripe' | 'dev';

export type PurchaseStatus = 'succeeded' | 'pending' | 'failed' | 'refunded';

export type Purchase = {
  id: string;
  user_id: string;
  sku: string;
  provider: PurchaseProvider;
  provider_txn_id: string;
  amount_cents: number;
  currency: string;
  status: PurchaseStatus;
  consumed_at: string | null;
  created_at: string;
};

export type FeedResponse = {
  posts: Post[];
  cursor: string | null;
};

export type BillingMode = 'auto' | 'stripe_only';

export type UsComposerAspect = '1:1' | '4:5' | '3:4';
