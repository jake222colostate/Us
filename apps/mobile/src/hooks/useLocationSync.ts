import { useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../api/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useLocationStore } from '../state/locationStore';
import type { Profile } from '@us/types';

type SupabaseProfileRow = Omit<Profile, 'location'> & { location: unknown };

function normalizeLocation(value: unknown): Profile['location'] {
  if (!value) {
    return null;
  }

  if (typeof value === 'object' && value !== null) {
    const maybeCoords = (value as { coordinates?: number[] }).coordinates;
    if (Array.isArray(maybeCoords) && maybeCoords.length === 2) {
      const [longitude, latitude] = maybeCoords;
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        return { latitude, longitude };
      }
    }
  }

  if (typeof value === 'string') {
    const match = value.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    if (match) {
      const longitude = Number(match[1]);
      const latitude = Number(match[2]);
      if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
        return { latitude, longitude };
      }
    }
  }

  return null;
}

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
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single<SupabaseProfileRow>();
      if (data) {
        const normalizedProfile = data as unknown as Profile;
        normalizedProfile.location = normalizeLocation(data.location);
        setProfile(normalizedProfile);
      }
    })();
  }, [session, setProfile]);
}
