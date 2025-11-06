import * as React from 'react';
export type Theme = { colors: { background: string; text: string; card: string; accent: string; muted: string; } };
const defaultTheme: Theme = { colors: { background: '#0b0b0f', text: '#ffffff', card: '#15151c', accent: '#7c5cff', muted: '#8a8fa3' } };
export function useTheme(): Theme { return defaultTheme; }
