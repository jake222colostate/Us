import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeedCard } from '../features/feed/components/FeedCard';
import type { Post } from '@us/types';
import { Alert } from 'react-native';

const sendFreeHeart = vi.fn().mockResolvedValue('heart-id');
const sendBigHeart = vi.fn().mockResolvedValue(undefined);
vi.mock('../features/feed/api', () => ({
  sendFreeHeart,
  sendBigHeart,
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

vi.mock('../providers/BillingProvider', async () => ({
  useBilling: () => ({ priceDisplay: '$3.99', beginBigHeartPurchase: vi.fn().mockResolvedValue({ purchaseId: 'test' }) }),
}));

describe('FeedCard', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    alertSpy = vi.spyOn(Alert, 'alert').mockImplementation(() => {});
    sendFreeHeart.mockClear();
    sendBigHeart.mockClear();
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
    await waitFor(() => {
      expect(sendFreeHeart).toHaveBeenCalledWith('1', 'user-1');
    });
  });

  it('prompts for big heart when free limit is reached', async () => {
    sendFreeHeart.mockRejectedValueOnce(new Error('FREE_HEART_LIMIT_REACHED'));
    const onOpenProfile = vi.fn();
    const client = new QueryClient();
    const { getByLabelText } = render(
      <QueryClientProvider client={client}>
        <FeedCard post={mockPost} onOpenProfile={onOpenProfile} />
      </QueryClientProvider>,
    );

    fireEvent.press(getByLabelText('Send heart'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });
});
