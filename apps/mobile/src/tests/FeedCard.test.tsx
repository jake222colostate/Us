import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeedCard } from '../features/feed/components/FeedCard';
import type { Post } from '@us/types';
import { Alert } from 'react-native';

vi.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');
  return ({ children, visible }: any) => (visible ? <>{children}</> : null);
});

vi.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
  requestMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
  launchCameraAsync: vi.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchImageLibraryAsync: vi.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: 'Images' },
}));

const sendFreeHeart = vi.fn().mockResolvedValue('heart-id');
const sendBigHeart = vi.fn().mockResolvedValue(undefined);
const uploadHeartSelfie = vi.fn().mockResolvedValue('https://example.com/selfie.jpg');
vi.mock('../features/feed/api', () => ({
  sendFreeHeart,
  sendBigHeart,
  uploadHeartSelfie,
}));

const mockPost: Post = {
  id: '1',
  user_id: 'user-1',
  photo_url: 'https://example.com/photo.jpg',
  caption: 'Hello world',
  location: null,
  created_at: new Date().toISOString(),
};

vi.mock('../providers/AuthProvider', async () => {
  const actual = await vi.importActual<typeof import('../providers/AuthProvider')>('../providers/AuthProvider');
  return {
    ...actual,
    useAuth: () => ({
      session: { user: { id: 'viewer' } },
      sessionLoaded: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    }),
  };
});

vi.mock('../providers/ToastProvider', async () => ({
  useToast: () => ({ show: vi.fn() }),
}));

const beginBigHeartPurchase = vi.fn().mockResolvedValue({ purchaseId: 'test' });
vi.mock('../providers/BillingProvider', async () => ({
  useBilling: () => ({ priceDisplay: '$3.99', beginBigHeartPurchase }),
}));

describe('FeedCard', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    alertSpy = vi.spyOn(Alert, 'alert').mockImplementation(() => {});
    sendFreeHeart.mockClear();
    sendBigHeart.mockClear();
    uploadHeartSelfie.mockClear();
    beginBigHeartPurchase.mockClear();
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders post caption and sends heart', async () => {
    const onOpenProfile = vi.fn();
    const client = new QueryClient();
    const { getByLabelText, getByText } = render(
      <QueryClientProvider client={client}>
        <FeedCard post={mockPost} distanceText="2 km" onOpenProfile={onOpenProfile} />
      </QueryClientProvider>,
    );
    expect(getByText('Hello world')).toBeTruthy();
    fireEvent.press(getByLabelText('Send heart'));
    fireEvent.press(getByText('Send Heart'));
    await waitFor(() => {
      expect(sendFreeHeart).toHaveBeenCalledWith('1', 'user-1', undefined);
    });
  });

  it('includes message when provided', async () => {
    const onOpenProfile = vi.fn();
    const client = new QueryClient();
    const { getByLabelText, getByText, getByPlaceholderText } = render(
      <QueryClientProvider client={client}>
        <FeedCard post={mockPost} onOpenProfile={onOpenProfile} />
      </QueryClientProvider>,
    );

    fireEvent.press(getByLabelText('Send heart'));
    fireEvent.changeText(getByPlaceholderText('Say something nice...'), 'Hi there!');
    fireEvent.press(getByText('Send Heart'));

    await waitFor(() => {
      expect(sendFreeHeart).toHaveBeenCalledWith('1', 'user-1', { message: 'Hi there!', selfieUrl: undefined });
    });
  });

  it('prompts for big heart when free limit is reached', async () => {
    sendFreeHeart.mockRejectedValueOnce(new Error('FREE_HEART_LIMIT_REACHED'));
    const onOpenProfile = vi.fn();
    const client = new QueryClient();
    const { getByLabelText, getByText } = render(
      <QueryClientProvider client={client}>
        <FeedCard post={mockPost} onOpenProfile={onOpenProfile} />
      </QueryClientProvider>,
    );

    fireEvent.press(getByLabelText('Send heart'));
    fireEvent.press(getByText('Send Heart'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });
});
