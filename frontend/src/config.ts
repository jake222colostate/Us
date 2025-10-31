const DEFAULT_API_BASE = '/api';

type RuntimeEnv = {
  VITE_API_BASE?: string;
  EXPO_PUBLIC_API_BASE?: string;
};

const readViteEnv = (): RuntimeEnv => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as ImportMeta).env) {
      return { VITE_API_BASE: (import.meta as ImportMeta).env.VITE_API_BASE };
    }
  } catch (error) {
    // ignored - runtime without import.meta support
  }

  return {};
};

const readExpoEnv = (): RuntimeEnv => {
  if (typeof process !== 'undefined' && process.env) {
    return { EXPO_PUBLIC_API_BASE: process.env.EXPO_PUBLIC_API_BASE };
  }

  return {};
};

const runtimeEnv: RuntimeEnv = {
  ...readExpoEnv(),
  ...readViteEnv(),
};

export const apiBase =
  runtimeEnv.VITE_API_BASE || runtimeEnv.EXPO_PUBLIC_API_BASE || DEFAULT_API_BASE;
