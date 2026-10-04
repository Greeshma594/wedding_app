import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import type { BookingState, DayStatus } from '../lib/blocking';
import { colors, radius, space, type } from '../theme';

export function Screen({ children, refreshControl }: { children: ReactNode; refreshControl?: React.ReactElement<any> }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}>
      {children}
    </ScrollView>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        pressed && { opacity: 0.8 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.accent} />
      ) : (
        <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  error,
  ...input
}: TextInputProps & { label: string; hint?: string; error?: string | null }) {
  return (
    <View style={styles.field}>
      <Text style={type.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        {...input}
        style={[styles.input, input.multiline && styles.inputMultiline, error ? styles.inputError : null]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : hint ? <Text style={type.small}>{hint}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Row({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowValueStrong]}>{value}</Text>
    </View>
  );
}

export function Message({ tone = 'error', children }: { tone?: 'error' | 'info' | 'success'; children: ReactNode }) {
  const palette = {
    error: { bg: colors.criticalSoft, fg: colors.critical },
    info: { bg: colors.accentSoft, fg: colors.accent },
    success: { bg: colors.goodSoft, fg: colors.good },
  }[tone];
  return (
    <View style={[styles.message, { backgroundColor: palette.bg }]}>
      <Text style={{ color: palette.fg, fontSize: 15 }}>{children}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

const PILL: Record<BookingState | DayStatus, { label: string; bg: string; fg: string }> = {
  upcoming: { label: 'Upcoming', bg: colors.accentSoft, fg: colors.accent },
  out: { label: 'Out', bg: colors.goldSoft, fg: colors.gold },
  overdue: { label: 'Overdue', bg: colors.criticalSoft, fg: colors.critical },
  returned: { label: 'Returned', bg: colors.goodSoft, fg: colors.good },
  rented: { label: 'Rented', bg: colors.accentSoft, fg: colors.accent },
  buffer: { label: 'Cleaning day', bg: colors.warnSoft, fg: colors.warn },
};

export function StatusPill({ status }: { status: BookingState | DayStatus }) {
  const p = PILL[status];
  return (
    <View style={[styles.pill, { backgroundColor: p.bg }]}>
      <Text style={[styles.pillText, { color: p.fg }]}>{p.label}</Text>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Text style={type.heading}>{title}</Text>
      <Text style={[type.small, { textAlign: 'center' }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl * 2 },
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_primary: { backgroundColor: colors.accent },
  button_secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  button_danger: { backgroundColor: colors.critical },
  button_ghost: { backgroundColor: 'transparent' },
  buttonText: { fontSize: 16, fontWeight: '600' },
  buttonText_primary: { color: '#fff' },
  buttonText_secondary: { color: colors.accent },
  buttonText_danger: { color: '#fff' },
  buttonText_ghost: { color: colors.accent },
  field: { gap: space.xs + 2 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    color: colors.ink,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  inputError: { borderColor: colors.critical },
  errorText: { color: colors.critical, fontSize: 13 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: space.md,
  },
  sectionTitle: { ...type.label, textTransform: 'uppercase', letterSpacing: 0.8, color: colors.accent },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  rowLabel: { color: colors.muted, fontSize: 15, flexShrink: 0 },
  rowValue: { color: colors.ink, fontSize: 15, textAlign: 'right', flexShrink: 1 },
  rowValueStrong: { fontWeight: '700', color: colors.accent },
  message: { borderRadius: radius.md, padding: space.md },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, backgroundColor: colors.bg },
  pill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl, paddingHorizontal: space.lg },
});
