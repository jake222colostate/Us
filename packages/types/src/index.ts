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
