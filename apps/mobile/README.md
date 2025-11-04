# Mobile app

## Navigation Service

The mobile app exposes a typed navigation service in `src/navigation/navigationService.ts`. Import the helpers when you need to trigger navigation outside of a screen component:

```ts
import { navigate, reset } from 'src/navigation/navigationService';

navigate('MainTabs');
```

Behind the scenes we removed the legacy `rootNavigation` singleton. The service wraps React Navigation’s `createNavigationContainerRef` and only executes actions once the container is ready. In development you will see `[nav]` warnings if a helper is invoked before the tree mounts; wait for the `[nav] ready? true` log in Metro/Expo when debugging navigation issues.
