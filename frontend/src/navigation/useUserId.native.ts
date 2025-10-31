import { useLocalSearchParams } from 'expo-router';

export function useUserId() {
  const params = useLocalSearchParams<{ id?: string }>();
  return params.id ?? '';
}
