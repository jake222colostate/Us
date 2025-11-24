import { useState } from 'react';

export function useNetworkStatus() {
  const [isOnline] = useState(true);
  return { isOnline };
}
