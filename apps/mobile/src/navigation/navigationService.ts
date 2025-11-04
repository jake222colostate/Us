import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList, AuthStackParamList } from './RootNavigator';

// The navigation tree swaps between the auth stack and the main app stack.
// We combine their param lists so helpers can navigate across either surface.
export type AppNavigatorParams = RootStackParamList & AuthStackParamList;

export const navigationRef = createNavigationContainerRef<AppNavigatorParams>();

type ResetState = Parameters<typeof navigationRef.reset>[0];

function warnNotReady(action: string) {
  if (__DEV__) {
    console.warn(`[nav] navigationRef not ready for ${action}`);
  }
}

export function navigate<RouteName extends keyof AppNavigatorParams>(
  name: RouteName,
  params?: AppNavigatorParams[RouteName],
) {
  if (!navigationRef.isReady()) {
    warnNotReady(`navigate(${String(name)})`);
    return;
  }
  navigationRef.navigate(name as never, params as never);
}

export function reset(state: ResetState) {
  if (!navigationRef.isReady()) {
    warnNotReady('reset');
    return;
  }
  navigationRef.reset(state as never);
}

export function getCurrentRoute() {
  if (!navigationRef.isReady()) {
    warnNotReady('getCurrentRoute');
    return null;
  }
  return navigationRef.getCurrentRoute();
}

export function logNavigationReady() {
  if (!__DEV__) {
    return;
  }
  const routeName = navigationRef.getCurrentRoute()?.name ?? 'unknown';
  console.debug('[nav] ready?', navigationRef.isReady(), 'route', routeName);
}
