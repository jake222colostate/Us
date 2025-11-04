import { create } from 'zustand';

export type UserPost = {
  id: string;
  userId: string;
  name: string;
  age?: number;
  bio?: string;
  avatar?: string;
  photoUrl: string;
  createdAt: number;
};

type UserPostsState = {
  posts: UserPost[];
  addPost: (post: UserPost) => void;
};

export const useUserPostsStore = create<UserPostsState>((set) => ({
  posts: [],
  addPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts.filter((existing) => existing.id !== post.id)],
    })),
}));
