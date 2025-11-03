import { useMemo } from 'react';
import { demoUser, sampleMatches, sampleProfiles } from '../data/sampleProfiles';

export function useSampleProfiles() {
  return useMemo(() => sampleProfiles, []);
}

export function useSampleMatches() {
  return useMemo(() => sampleMatches, []);
}

export function useDemoUser() {
  return useMemo(() => demoUser, []);
}
