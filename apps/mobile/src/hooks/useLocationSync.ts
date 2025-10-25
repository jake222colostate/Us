import { useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../api/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useLocationStore } from '../state/locationStore';

export function useLocationSync() {
  const { session } = useAuth();
  const setProfile = useLocationStore((state) => state.setProfile);

  useEffect(() => {
    if (!session) return;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      await supabase.from('profiles').update({
        location: `SRID=4326;POINT(${position.coords.longitude} ${position.coords.latitude})`,
      }).eq('user_id', session.user.id);
      const { data } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
      if (data) {
        setProfile(data as any);
      }
    })();
  }, [session, setProfile]);
}
