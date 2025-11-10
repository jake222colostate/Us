export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';
export interface ApiClient {
  [key: string]: unknown;
}
