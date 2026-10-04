import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateField } from '../../components/Calendar';
import { DressGrid, DressPhoto } from '../../components/dress';
import { Button, Card, Field, Message, Row, Screen, SectionTitle } from '../../components/ui';
import { createBooking, getDress, listDresses } from '../../lib/api';
import { balanceDue, validateBookingDraft } from '../../lib/blocking';
import { addDays, isValidISODate, todayISO, type ISODate } from '../../lib/dates';
import { formatMoney, parseAmount } from '../../lib/format';
import type { Dress } from '../../lib/types';
import { useSection } from '../../lib/useSection';
import { colors, radius, space, type } from '../../theme';

export default function NewBookingScreen() {
  const section = useSection();
  const params = useLocalSearchParams<{ dressId?: string; start?: string }>();
  const today = todayISO();

  const [dress, setDress] = useState<Dress | null>(null);
  const [picking, setPicking] = useState(false);
  const [catalogue, setCatalogue] = useState<Dress[] | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const initialStart = params.start && isValidISODate(params.start) ? params.start : null;
  const [startDate, setStartDate] = useState<ISODate | null>(initialStart);
  const [endDate, setEndDate] = useState<ISODate | null>(initialStart);
  const [returnDate, setReturnDate] = useState<ISODate | null>(initialStart ? addDays(initialStart, 1) : null);
  const [total, setTotal] = useState('');
  const [collected, setCollected] = useState('');
  const [measurements, setMeasurements] = useState('');
  const [customChanges, setCustomChanges] = useState('');
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState('');

  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (params.dressId) getDress(params.dressId).then(setDress).catch(() => setDress(null));
  }, [params.dressId]);

  const openPicker = async () => {
    setPicking(true);
    try {
      setCatalogue(await listDresses(section));
    } catch {
      setCatalogue([]);
    }
  };

  // Moving the start date carries the end and return dates along if they would be before it.
  const changeStart = (d: ISODate) => {
    setStartDate(d);
    if (!endDate || endDate < d) setEndDate(d);
    if (!returnDate || returnDate < d) setReturnDate(addDays(endDate && endDate >= d ? endDate : d, 1));
  };
  const changeEnd = (d: ISODate) => {
    setEndDate(d);
    if (!returnDate || returnDate < d) setReturnDate(addDays(d, 1));
  };

  const totalAmount = parseAmount(total);
  const collectedAmount = collected.trim() === '' ? 0 : parseAmount(collected);
  const balance = totalAmount !== null && collectedAmount !== null ? balanceDue(totalAmount, collectedAmount) : null;

  const save = async () => {
    const problems: string[] = [];
    if (!dress) problems.push('Choose the dress.');
    if (!customerName.trim()) problems.push('Enter the customer name.');
    if (!customerPhone.trim()) problems.push('Enter the customer phone number.');
    problems.push(
      ...validateBookingDraft({
        start_date: startDate,
        end_date: endDate,
        return_date: returnDate,
        total_price: totalAmount,
        amount_collected: collectedAmount,
      }),
    );
    if (!signature.trim()) problems.push('Ask the customer to type their name to acknowledge the booking.');
    setErrors(problems);
    if (problems.length > 0 || !dress || !startDate || !endDate || !returnDate) return;

    setSaving(true);
    try {
      const booking = await createBooking({
        dress_id: dress.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        start_date: startDate,
        end_date: endDate,
        return_date: returnDate,
        total_price: totalAmount ?? 0,
        amount_collected: collectedAmount ?? 0,
        measurements: measurements.trim() || null,
        custom_changes: customChanges.trim() || null,
        notes: notes.trim() || null,
        signature_name: signature.trim(),
      });
      router.replace(`/booking/${booking.id}`);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : 'Could not save the booking.']);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'New booking' }} />

      <SectionTitle>Dress</SectionTitle>
      <Pressable accessibilityRole="button" onPress={openPicker} style={styles.dressPicker}>
        {dress ? (
          <>
            <DressPhoto path={dress.thumb_path} style={styles.dressThumb} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.dressCode}>{dress.code}</Text>
              <Text style={type.body}>{dress.name}</Text>
              <Text style={type.small}>Tap to change</Text>
            </View>
          </>
        ) : (
          <Text style={[type.body, { color: colors.accent }]}>Choose a dress from the catalogue</Text>
        )}
      </Pressable>

      <SectionTitle>Customer</SectionTitle>
      <Field label="Customer name" value={customerName} onChangeText={setCustomerName} autoCapitalize="words" />
      <Field label="Phone number" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
      <Field
        label="Measurements"
        value={measurements}
        onChangeText={setMeasurements}
        multiline
        placeholder={'Bust 34, waist 28, hip 36, length 42…'}
        hint="Write the customer's body measurements."
      />
      <Field
        label="Custom changes requested"
        value={customChanges}
        onChangeText={setCustomChanges}
        multiline
        placeholder="Shorten sleeves by 1 inch, add hooks at the back…"
        hint="Any alterations or changes the customer asked for."
      />

      <SectionTitle>Dates</SectionTitle>
      <View style={styles.pair}>
        <DateField label="Rental starts" value={startDate} onChange={changeStart} minDate={today} />
        <DateField label="Rental ends" value={endDate} onChange={changeEnd} minDate={startDate ?? today} />
      </View>
      <DateField label="Return by" value={returnDate} onChange={setReturnDate} minDate={endDate ?? startDate ?? today} />
      <Text style={type.small}>The dress stays blocked until 1 day after it is actually returned, for cleaning.</Text>

      <SectionTitle>Payment</SectionTitle>
      <View style={styles.pair}>
        <View style={{ flex: 1 }}>
          <Field label="Total price" value={total} onChangeText={setTotal} keyboardType="decimal-pad" placeholder="0" />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="Amount collected"
            value={collected}
            onChangeText={setCollected}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>
      </View>
      <Card>
        <Row label="Balance due" value={balance === null ? '—' : formatMoney(balance)} strong />
      </Card>

      <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Anything else to remember" />

      <SectionTitle>Acknowledgement</SectionTitle>
      <Field
        label="Customer signature"
        value={signature}
        onChangeText={setSignature}
        autoCapitalize="words"
        placeholder="Customer types their full name"
        hint="By typing their name, the customer confirms the booking details above."
      />

      {errors.length > 0 ? <Message>{errors.join('\n')}</Message> : null}
      <Button label="Save booking" onPress={save} loading={saving} />

      <Modal visible={picking} animationType="slide" onRequestClose={() => setPicking(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={type.heading}>Choose a dress</Text>
            <Button label="Close" variant="ghost" onPress={() => setPicking(false)} />
          </View>
          <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
            {catalogue === null ? <Text style={type.small}>Loading catalogue…</Text> : null}
            {catalogue?.length === 0 ? (
              <Message tone="info">No dresses in this section yet. Add one from the catalogue first.</Message>
            ) : null}
            {catalogue ? (
              <DressGrid
                dresses={catalogue}
                onPress={(d) => {
                  setDress(d);
                  setPicking(false);
                }}
              />
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dressPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
    minHeight: 64,
  },
  dressThumb: { width: 64, height: 80, borderRadius: radius.sm },
  dressCode: { fontSize: 12, fontWeight: '700', color: colors.accent },
  pair: { flexDirection: 'row', gap: space.md },
  modal: { flex: 1, backgroundColor: colors.bg, paddingTop: space.xxl },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
});
