import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatShortDate } from '../lib/dates';
import { formatMoney } from '../lib/format';
import type { BookingWithDress } from '../lib/types';
import { colors, radius, space } from '../theme';
import { DressPhoto } from './dress';

/** One booking in a list: dress thumbnail, customer, dates and a status pill. */
export function BookingRow({ booking, pill }: { booking: BookingWithDress; pill: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/booking/${booking.id}`)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
      <DressPhoto path={booking.dress.thumb_path} style={styles.photo} />
      <View style={styles.body}>
        <Text style={styles.customer} numberOfLines={1}>
          {booking.customer_name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {booking.dress.code} · {formatShortDate(booking.start_date)} to {formatShortDate(booking.end_date)} · back{' '}
          {formatShortDate(booking.return_date)}
        </Text>
        <View style={styles.footer}>
          {pill}
          {booking.balance_due > 0 ? (
            <Text style={styles.balance}>Balance {formatMoney(booking.balance_due)}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.sm,
  },
  photo: { width: 64, height: 80, borderRadius: radius.sm },
  body: { flex: 1, gap: 4, justifyContent: 'center' },
  customer: { fontSize: 16, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
  footer: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  balance: { fontSize: 13, fontWeight: '600', color: colors.accent },
});
