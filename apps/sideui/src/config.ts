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

export const DATE_LOCALE = "en-US";
