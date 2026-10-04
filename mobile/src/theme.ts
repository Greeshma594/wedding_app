export const colors = {
  bg: '#F7F5F7',
  surface: '#FFFFFF',
  ink: '#2A1F2D',
  muted: '#6D6170',
  line: '#E4DDE6',
  accent: '#7A2E5C',
  accentSoft: '#F3E6EE',
  gold: '#A67C2E',
  goldSoft: '#F6EEDF',
  good: '#2F7A52',
  goodSoft: '#E3F2EA',
  warn: '#9A5B00',
  warnSoft: '#FBEFD9',
  critical: '#B3261E',
  criticalSoft: '#FBE4E2',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const type = {
  title: { fontSize: 26, fontWeight: '700' as const, color: colors.ink },
  heading: { fontSize: 18, fontWeight: '700' as const, color: colors.ink },
  body: { fontSize: 16, color: colors.ink },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.muted },
  small: { fontSize: 13, color: colors.muted },
};
