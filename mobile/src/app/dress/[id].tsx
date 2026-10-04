import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DressPhoto } from '../../components/dress';
import { Button, Card, Loading, Message, Row, Screen, SectionTitle, StatusPill } from '../../components/ui';
import { getDress, listBookingsForDress } from '../../lib/api';
import { bookingState } from '../../lib/blocking';
import { formatShortDate, todayISO } from '../../lib/dates';
import { SECTIONS } from '../../lib/types';
import { useLoader } from '../../lib/useLoader';
import { colors, radius, space, type } from '../../theme';

export default function DressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error } = useLoader(async () => {
    const [dress, bookings] = await Promise.all([getDress(id), listBookingsForDress(id)]);
    return { dress, bookings };
  }, [id]);

  if (error) return <Screen><Message>{error}</Message></Screen>;
  if (!data) return <Loading />;
  const { dress, bookings } = data;
  const today = todayISO();

  return (
    <Screen>
      <Stack.Screen options={{ title: dress.code }} />
      <DressPhoto path={dress.image_path} style={styles.photo} />
      <View style={{ gap: 2 }}>
        <Text style={styles.code}>{dress.code}</Text>
        <Text style={type.title}>{dress.name}</Text>
      </View>
      <Card>
        <Row label="Section" value={SECTIONS[dress.section].title} />
        {dress.size ? <Row label="Size" value={dress.size} /> : null}
        {dress.colour ? <Row label="Colour" value={dress.colour} /> : null}
        {dress.notes ? <Text style={type.body}>{dress.notes}</Text> : null}
      </Card>
      <Button
        label="Book this dress"
        onPress={() =>
          router.push({ pathname: '/[section]/new-booking', params: { section: dress.section, dressId: dress.id } })
        }
      />

      <SectionTitle>Bookings for this dress</SectionTitle>
      {bookings.length === 0 ? <Text style={type.small}>No bookings yet.</Text> : null}
      {bookings.map((b) => (
        <Pressable
          key={b.id}
          accessibilityRole="button"
          onPress={() => router.push(`/booking/${b.id}`)}
          style={({ pressed }) => [styles.booking, pressed && { opacity: 0.85 }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={type.body}>{b.customer_name}</Text>
            <Text style={type.small}>
              {formatShortDate(b.start_date)} to {formatShortDate(b.end_date)} · back {formatShortDate(b.return_date)}
            </Text>
          </View>
          <StatusPill status={bookingState(b, today)} />
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 3 / 4, maxHeight: 520, borderRadius: radius.lg },
  code: { fontSize: 13, fontWeight: '700', color: colors.accent },
  booking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
  },
});
