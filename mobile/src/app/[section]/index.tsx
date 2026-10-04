import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Message, Screen } from '../../components/ui';
import { listBookings } from '../../lib/api';
import { bookingState } from '../../lib/blocking';
import { todayISO } from '../../lib/dates';
import { SECTIONS } from '../../lib/types';
import { useLoader } from '../../lib/useLoader';
import { useSection } from '../../lib/useSection';
import { colors, radius, space, type } from '../../theme';

export default function SectionScreen() {
  const section = useSection();
  const { data: active } = useLoader(() => listBookings(section, 'active'), [section]);

  const today = todayISO();
  const overdue = active?.filter((b) => bookingState(b, today) === 'overdue').length ?? 0;
  const out = active?.filter((b) => bookingState(b, today) === 'out').length ?? 0;

  const items = [
    { title: 'Catalogue', body: 'Browse dresses and add new ones', href: `/${section}/catalogue` },
    { title: 'New booking', body: 'Book a dress for a customer', href: `/${section}/new-booking` },
    { title: 'Check a date', body: 'See which dresses are blocked or free', href: `/${section}/availability` },
    {
      title: 'Bookings',
      body: active ? `${out} out now · ${active.length} active in total` : 'Upcoming, out and returned',
      href: `/${section}/bookings`,
    },
  ] as const;

  return (
    <Screen>
      <Stack.Screen options={{ title: SECTIONS[section].title }} />
      {overdue > 0 ? (
        <Pressable onPress={() => router.push(`/${section}/bookings`)}>
          <Message>
            {overdue} {overdue === 1 ? 'dress is' : 'dresses are'} overdue. Tap to see who has them.
          </Message>
        </Pressable>
      ) : null}
      <View style={{ gap: space.md }}>
        {items.map((item) => (
          <Pressable
            key={item.title}
            accessibilityRole="button"
            onPress={() => router.push(item.href)}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.85 }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={type.heading}>{item.title}</Text>
              <Text style={type.small}>{item.body}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
  },
  chevron: { fontSize: 28, color: colors.accent, marginLeft: space.sm },
});
