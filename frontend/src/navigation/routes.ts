import type { ComponentType } from 'react';

import AuthScreen from '../screens/AuthScreen';
import ChatScreen from '../screens/ChatScreen';
import FeedScreen from '../screens/FeedScreen';
import HelpScreen from '../screens/HelpScreen';
import HomeScreen from '../screens/HomeScreen';
import LikesScreen from '../screens/LikesScreen';
import MatchesScreen from '../screens/MatchesScreen';
import NotFoundScreen from '../screens/NotFoundScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SafetyScreen from '../screens/SafetyScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

export type RouteConfig = {
  path: string;
  component: ComponentType;
  label?: string;
  showInNav?: boolean;
};

export const appRoutes: RouteConfig[] = [
  { path: '/', component: HomeScreen, label: 'Home', showInNav: true },
  { path: '/feed', component: FeedScreen, label: 'Feed', showInNav: true },
  { path: '/likes', component: LikesScreen, label: 'Likes', showInNav: true },
  { path: '/matches', component: MatchesScreen, label: 'Matches', showInNav: true },
  { path: '/chat', component: ChatScreen, label: 'Chat', showInNav: true },
  { path: '/profile', component: ProfileScreen, label: 'Profile' },
  { path: '/profile/edit', component: ProfileEditScreen },
  { path: '/user/:id', component: UserProfileScreen },
  { path: '/settings', component: SettingsScreen },
  { path: '/notifications', component: NotificationsScreen },
  { path: '/onboarding', component: OnboardingScreen },
  { path: '/safety', component: SafetyScreen },
  { path: '/help', component: HelpScreen },
  { path: '/auth', component: AuthScreen },
  { path: '*', component: NotFoundScreen },
];

export const bottomNavRoutes = appRoutes.filter((route) => route.showInNav);
