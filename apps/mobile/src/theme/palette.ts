import { useThemeStore } from '../state/themeStore';

export type AppPalette = {
  background: string;
  card: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  muted: string;
  accent: string;
  accentMuted: string;
  danger: string;
  success: string;
  overlay: string;
};

const darkPalette: AppPalette = {
  background: '#0b1220',
  card: '#111b2e',
  surface: '#0f172a',
  border: '#1f2937',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5f5',
  muted: '#94a3b8',
  accent: '#a855f7',
  accentMuted: '#7c3aed',
  danger: '#f87171',
  success: '#22c55e',
  overlay: 'rgba(5, 10, 20, 0.85)',
};

const lightPalette: AppPalette = {
  background: '#fdf8ff',
  card: '#ffffff',
  surface: '#f4e6ff',
  border: '#e5def6',
  textPrimary: '#2f0c4d',
  textSecondary: '#4b2c72',
  muted: '#7c699b',
  accent: '#a855f7',
  accentMuted: '#c084fc',
  danger: '#dc2626',
  success: '#16a34a',
  overlay: 'rgba(255, 255, 255, 0.85)',
};

export const useAppTheme = (): AppPalette => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  return isDarkMode ? darkPalette : lightPalette;
};
