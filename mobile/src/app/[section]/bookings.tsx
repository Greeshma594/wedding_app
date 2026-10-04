import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { BookingRow } from '../../components/BookingRow';
import { EmptyState, Loading, Message, Screen, StatusPill } from '../../components/ui';
import { listBookings } from '../../lib/api';
import { bookingState, type BookingState } from '../../lib/blocking';
import { todayISO } from '../../lib/dates';
import { SECTIONS } from '../../lib/types';
import { useLoader } from '../../lib/useLoader';
import { useSection } from '../../lib/useSection';
import { colors, radius, space } from '../../theme';

// Overdue first, then dresses out now, then upcoming.
const ORDER: Record<BookingState, number> = { overdue: 0, out: 1, upcoming: 2, returned: 3 };

export default function BookingsScreen() {
  const section = useSection();
  const [filter, setFilter] = useState<'active' | 'returned'>('active');
  const { data, error, loading, reload } = useLoader(() => listBookings(section, filter), [section, filter]);
  const today = todayISO();

  const rows = (data ?? [])
    .map((b) => ({ booking: b, state: bookingState(b, today) }))
    .sort((a, b) => ORDER[a.state] - ORDER[b.state]);

  return (
    <Screen refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}>
      <Stack.Screen options={{ title: `${SECTIONS[section].title} bookings` }} />
      <View style={styles.tabs}>
        {(['active', 'returned'] as const).map((f) => (
          <Pressable
            key={f}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === f }}
            onPress={() => setFilter(f)}
            style={[styles.tab, filter === f && styles.tabActive]}>
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
              {f === 'active' ? 'Active' : 'Returned'}
            </Text>
          </Pressable>
        ))}
      </View>
      {error ? <Message>{error}</Message> : null}
      {loading && !data ? <Loading /> : null}
      {data && rows.length === 0 ? (
        <EmptyState
          title={filter === 'active' ? 'No active bookings' : 'No returned bookings yet'}
          body={filter === 'active' ? 'New bookings show here until the dress is returned.' : 'Bookings move here once the dress is marked returned.'}
        />
      ) : null}
      <View style={{ gap: space.sm }}>
        {rows.map(({ booking, state }) => (
          <BookingRow key={booking.id} booking={booking} pill={<StatusPill status={state} />} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: space.sm, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.accent },
  tabText: { fontSize: 15, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: '#fff' },
});
