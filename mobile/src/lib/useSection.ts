import { useLocalSearchParams } from 'expo-router';

import { isSection, type Section } from './types';

/** The section ('wear' or 'guest') from the URL, defaulting to 'wear' for an unknown value. */
export function useSection(): Section {
  const { section } = useLocalSearchParams<{ section: string }>();
  return isSection(section) ? section : 'wear';
}
