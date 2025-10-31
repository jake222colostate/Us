import { vi } from 'vitest';

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children,
}));

vi.mock('expo-image', () => ({
  Image: ({ children }: any) => children ?? null,
}));

vi.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: ({ children, ...rest }: any) => null,
}));

vi.mock('expo-haptics', () => ({
  selectionAsync: vi.fn(),
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: { Heavy: 'Heavy', Medium: 'Medium' },
}));
