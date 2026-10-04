import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { BookingRow } from '../../components/BookingRow';
import { Calendar } from '../../components/Calendar';
import { DressGrid } from '../../components/dress';
import { Card, EmptyState, Message, Screen, SectionTitle, StatusPill } from '../../components/ui';
import { listBookingsBetween, listDresses } from '../../lib/api';
import { statusOn } from '../../lib/blocking';
import { formatDate, monthBounds, monthGrid, parseISODate, todayISO, type ISODate } from '../../lib/dates';
import { SECTIONS } from '../../lib/types';
import { useLoader } from '../../lib/useLoader';
import { useSection } from '../../lib/useSection';
import { space, type } from '../../theme';

export default function AvailabilityScreen() {
  const section = useSection();
  const today = todayISO();
  const [selected, setSelected] = useState<ISODate>(today);
  const [view, setView] = useState(() => {
    const d = parseISODate(today);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const { data, error } = useLoader(async () => {
    const { first, last } = monthBounds(view.year, view.month);
    const from = selected < first ? selected : first;
    const to = selected > last ? selected : last;
    const [bookings, dresses] = await Promise.all([listBookingsBetween(section, from, to), listDresses(section)]);
    return { bookings, dresses };
  }, [section, view.year, view.month, selected]);

  const marks = useMemo(() => {
    const counts: Record<ISODate, number> = {};
    if (!data) return counts;
    for (const day of monthGrid(view.year, view.month).flat()) {
      if (!day) continue;
      const blockedDresses = new Set(data.bookings.filter((b) => statusOn(b, day, today)).map((b) => b.dress_id));
      if (blockedDresses.size) counts[day] = blockedDresses.size;
    }
    return counts;
  }, [data, view.year, view.month, today]);

  const blocked = useMemo(
    () =>
      (data?.bookings ?? [])
        .map((b) => ({ booking: b, status: statusOn(b, selected, today) }))
        .filter((x): x is { booking: (typeof x)['booking']; status: NonNullable<(typeof x)['status']> } => x.status !== null),
    [data, selected, today],
  );
  const blockedIds = new Set(blocked.map((x) => x.booking.dress_id));
  const available = (data?.dresses ?? []).filter((d) => !blockedIds.has(d.id));

  return (
    <Screen>
      <Stack.Screen options={{ title: `${SECTIONS[section].title}: check a date` }} />
      <Card>
        <Calendar
          selected={selected}
          onSelect={setSelected}
          marks={marks}
          onMonthChange={(year, month) => setView({ year, month })}
        />
        <Text style={type.small}>Numbers show how many dresses are blocked that day.</Text>
      </Card>
      {error ? <Message>{error}</Message> : null}

      <SectionTitle>
        Blocked on {formatDate(selected)} ({blocked.length})
      </SectionTitle>
      {data && blocked.length === 0 ? <Text style={type.small}>No dresses are blocked on this date.</Text> : null}
      <View style={{ gap: space.sm }}>
        {blocked.map(({ booking, status }) => (
          <BookingRow key={booking.id} booking={booking} pill={<StatusPill status={status} />} />
        ))}
      </View>

      <SectionTitle>
        Available on {formatDate(selected)} ({available.length})
      </SectionTitle>
      {data && data.dresses.length === 0 ? (
        <EmptyState title="No dresses yet" body="Add dresses to the catalogue to see what's free." />
      ) : null}
      {available.length > 0 ? (
        <>
          <Text style={type.small}>Tap a dress to book it from this date.</Text>
          <DressGrid
            dresses={available}
            onPress={(d) =>
              router.push({
                pathname: '/[section]/new-booking',
                params: { section, dressId: d.id, ...(selected >= today ? { start: selected } : {}) },
              })
            }
          />
        </>
      ) : null}
    </Screen>
  );
}
