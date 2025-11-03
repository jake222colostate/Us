const RAW_ENABLE_DEMO =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_ENABLE_DEMO) ||
  (typeof process !== "undefined" && (process as any).env?.VITE_ENABLE_DEMO) ||
  "true";

export const ENABLE_DEMO_DATA = String(RAW_ENABLE_DEMO).toLowerCase() !== "false";

const RAW_SUPABASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" && (process as any).env?.VITE_SUPABASE_URL) ||
  "";

const RAW_SUPABASE_ANON_KEY =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" && (process as any).env?.VITE_SUPABASE_ANON_KEY) ||
  "";

export const SUPABASE_URL = RAW_SUPABASE_URL.trim();
export const SUPABASE_ANON_KEY = RAW_SUPABASE_ANON_KEY.trim();

const RAW_STORAGE_BUCKET =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_STORAGE_BUCKET) ||
  (typeof process !== "undefined" && (process as any).env?.VITE_SUPABASE_STORAGE_BUCKET) ||
  "profile-photos";

export const PROFILE_STORAGE_BUCKET = String(RAW_STORAGE_BUCKET).trim() || "profile-photos";

export const DATE_LOCALE = "en-US";
