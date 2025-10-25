import React, { PropsWithChildren, createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

export type Theme = {
  mode: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    text: string;
    textMuted: string;
    primary: string;
    danger: string;
    success: string;
    border: string;
    glow: string;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  shadows: {
    soft: {
      shadowColor: string;
      shadowOpacity: number;
      shadowRadius: number;
      shadowOffset: { width: number; height: number };
      elevation: number;
    };
  };
};

const LIGHT: Theme = {
  mode: 'light',
  colors: {
    background: '#F8F7FD',
    surface: '#FFFFFF',
    surfaceMuted: '#F1EFF7',
    text: '#120B39',
    textMuted: '#6B678F',
    primary: '#FF4F8B',
    danger: '#FF3B30',
    success: '#1BC47D',
    border: '#E4E1F0',
    glow: '#FFD6E8',
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 18,
    xl: 24,
  },
  shadows: {
    soft: {
      shadowColor: '#120B39',
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
  },
};

const DARK: Theme = {
  ...LIGHT,
  mode: 'dark',
  colors: {
    ...LIGHT.colors,
    background: '#070511',
    surface: '#141124',
    surfaceMuted: '#1E1A31',
    text: '#FFFFFF',
    textMuted: '#D6CFF2',
    border: '#2E2647',
    glow: '#4D1D40',
  },
  shadows: {
    soft: {
      shadowColor: '#000000',
      shadowOpacity: 0.35,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 16,
    },
  },
};

const ThemeContext = createContext<Theme>(LIGHT);

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const scheme = useColorScheme();
  const theme = useMemo(() => (scheme === 'dark' ? DARK : LIGHT), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
