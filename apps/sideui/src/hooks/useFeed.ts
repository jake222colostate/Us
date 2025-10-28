import { useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useAuth } from '../../packages/auth/src';
import type { FeedResponse, Post as ApiPost } from '../../packages/api-client/src';
import type { Post as FeedCardPost } from "@/components/FeedCard";

type FeedQueryData = InfiniteData<FeedResponse>;

const computeAge = (birthdate?: string | null) => {
  if (!birthdate) return undefined;
  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return undefined;
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const toFeedCardPost = (post: ApiPost): FeedCardPost => {
  const profile = (post as ApiPost & { profile?: Record<string, unknown> }).profile as
    | {
        display_name?: string;
        photo_urls?: string[];
        birthdate?: string | null;
        user_id?: string;
        location?: { latitude?: number; longitude?: number } | null;
        radius_km?: number | null;
      }
    | undefined;

  const avatar = profile?.photo_urls?.[0];
  const displayName = (profile?.display_name as string | undefined) ?? "Someone";
  const age = computeAge(profile?.birthdate ?? null) ?? 0;
  const distance = profile?.radius_km ?? 0;

  return {
    id: post.id,
    userId: (profile?.user_id as string | undefined) ?? post.user_id,
    userName: displayName,
    userAge: age,
    userAvatar: avatar ?? post.photo_url ?? "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800",
    userDistance: typeof distance === "number" ? Math.round(distance) : 0,
    image: post.photo_url ?? "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",
    caption: post.caption ?? undefined,
    isLiked: Boolean((post as ApiPost & { liked?: boolean }).liked),
  };
};

export const useFeed = () => {
  const { api } = useAuth();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => api.feed.getFeed({ cursor: pageParam ?? null }),
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
  });

  const updatePost = (postId: string, updater: (post: ApiPost) => ApiPost) => {
    queryClient.setQueryData<FeedQueryData>(["feed"], (current) => {
      if (!current) return current;
      return {
        pageParams: current.pageParams,
        pages: current.pages.map((page) => ({
          ...page,
          posts: page.posts.map((post) => (post.id === postId ? updater(post) : post)),
        })),
      };
    });
  };

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      await api.feed.likeUser(postId);
      return postId;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      updatePost(postId, (post) => ({ ...(post as ApiPost & { liked?: boolean }), liked: true }));
      return { postId };
    },
    onError: (_error, _variables, context) => {
      if (context?.postId) {
        updatePost(context.postId, (post) => ({ ...(post as ApiPost & { liked?: boolean }), liked: false }));
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const passMutation = useMutation({
    mutationFn: async (postId: string) => {
      await api.feed.passUser(postId);
      return postId;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      queryClient.setQueryData<FeedQueryData>(["feed"], (current) => {
        if (!current) return current;
        return {
          pageParams: current.pageParams,
          pages: current.pages.map((page) => ({
            ...page,
            posts: page.posts.filter((post) => post.id !== postId),
          })),
        };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const posts = useMemo(() => {
    return (
      query.data?.pages.flatMap((page) => page.posts.map((post) => toFeedCardPost(post))) ?? []
    );
  }, [query.data]);

  return {
    posts,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    like: likeMutation.mutateAsync,
    pass: passMutation.mutateAsync,
  };
};

