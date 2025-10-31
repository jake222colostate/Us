import { useParams } from 'react-router-dom';

export function useUserId() {
  const params = useParams<{ id: string }>();
  return params.id ?? '';
}
