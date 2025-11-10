export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type BillingMode = 'sandbox' | 'production' | string;
export type Gender = 'female' | 'male' | 'non-binary' | 'other' | string;
export type LookingFor = 'women' | 'men' | 'everyone' | string;
export interface Profile {
  id: string;
  user_id: string;
  display_name?: string | null;
  photo_urls?: string[] | null;
  radius_km?: number | null;
  [key: string]: unknown;
}
export interface Post {
  id: string;
  user_id: string;
  photo_url?: string | null;
  caption?: string | null;
  profile?: Profile | null;
  [key: string]: unknown;
}
export interface Heart {
  id: string;
  kind: 'normal' | 'big' | string;
  from_user: string;
  created_at: string;
  post?: Post | null;
  profile?: Profile | null;
  [key: string]: unknown;
}
export type UsComposerAspect = 'square' | 'portrait' | 'landscape' | string;
export type HeartSelfieUpload = {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string | null;
};
export interface LikeGroupsByKind {
  big: Heart[];
  normal: Heart[];
}
