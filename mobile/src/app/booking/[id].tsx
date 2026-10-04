import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DressPhoto } from '../../components/dress';
import { ReviewButton } from '../../components/ReviewButton';
import {
  Button,
  Card,
  Field,
  Loading,
  Message,
  Row,
  Screen,
  SectionTitle,
  StatusPill,
} from '../../components/ui';
import { deleteBooking, getBooking, setAmountCollected, setReturnedOn } from '../../lib/api';
import { availableFrom, balanceDue, bookingState } from '../../lib/blocking';
import { formatDate, todayISO } from '../../lib/dates';
import { formatMoney, parseAmount } from '../../lib/format';
import { shareReceipt } from '../../lib/receipt';
import { useLoader } from '../../lib/useLoader';
import { colors, radius, space, type } from '../../theme';

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, error: loadError, reload } = useLoader(() => getBooking(id), [id]);

  const [payment, setPayment] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (loadError) return <Screen><Message>{loadError}</Message></Screen>;
  if (!booking) return <Loading />;

  const today = todayISO();
  const state = bookingState(booking, today);
  const freeFrom = availableFrom(booking, today);

  const run = async (label: string, action: () => Promise<void>, success?: string, reloadAfter = true) => {
    setBusy(label);
    setError(null);
    setNotice(null);
    try {
      await action();
      if (success) setNotice(success);
      if (reloadAfter) await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  };

  const recordPayment = () => {
    const amount = parseAmount(payment);
    if (amount === null || amount <= 0) return setError('Enter the amount the customer just paid.');
    const newCollected = booking.amount_collected + amount;
    if (newCollected > booking.total_price) {
      return setError(`That's more than the balance due of ${formatMoney(booking.balance_due)}.`);
    }
    run(
      'payment',
      async () => {
        await setAmountCollected(booking.id, newCollected);
        setPayment('');
      },
      `Payment of ${formatMoney(amount)} recorded. Balance now ${formatMoney(balanceDue(booking.total_price, newCollected))}.`,
    );
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: booking.customer_name }} />

      <View style={styles.header}>
        <DressPhoto path={booking.dress.thumb_path} style={styles.photo} />
        <View style={{ flex: 1, gap: 4 }}>
          <StatusPill status={state} />
          <Text style={type.heading}>{booking.customer_name}</Text>
          <Text style={type.small}>{booking.customer_phone}</Text>
          <Text style={styles.dress} onPress={() => router.push(`/dress/${booking.dress.id}`)}>
            {booking.dress.code} · {booking.dress.name}
          </Text>
        </View>
      </View>

      {notice ? <Message tone="success">{notice}</Message> : null}
      {error ? <Message>{error}</Message> : null}

      <SectionTitle>Dates</SectionTitle>
      <Card>
        <Row label="Rental" value={`${formatDate(booking.start_date)} to ${formatDate(booking.end_date)}`} />
        <Row label="Return by" value={formatDate(booking.return_date)} />
        {booking.returned_on ? <Row label="Returned on" value={formatDate(booking.returned_on)} /> : null}
        <Row
          label="Available again"
          value={freeFrom ? formatDate(freeFrom) : 'After it is returned'}
          strong={state === 'overdue'}
        />
      </Card>

      <SectionTitle>Payment</SectionTitle>
      <Card>
        <Row label="Total price" value={formatMoney(booking.total_price)} />
        <Row label="Amount collected" value={formatMoney(booking.amount_collected)} />
        <Row label="Balance due" value={formatMoney(booking.balance_due)} strong />
        {booking.balance_due > 0 ? (
          <View style={styles.paymentRow}>
            <View style={{ flex: 1 }}>
              <Field
                label="Customer paid now"
                value={payment}
                onChangeText={setPayment}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
            <Button label="Record" onPress={recordPayment} loading={busy === 'payment'} style={{ alignSelf: 'flex-end' }} />
          </View>
        ) : null}
      </Card>

      {booking.measurements || booking.custom_changes ? (
        <>
          <SectionTitle>Fitting</SectionTitle>
          <Card>
            {booking.measurements ? (
              <View style={{ gap: 4 }}>
                <Text style={type.label}>Measurements</Text>
                <Text style={type.body}>{booking.measurements}</Text>
              </View>
            ) : null}
            {booking.custom_changes ? (
              <View style={{ gap: 4 }}>
                <Text style={type.label}>Custom changes requested</Text>
                <Text style={type.body}>{booking.custom_changes}</Text>
              </View>
            ) : null}
          </Card>
        </>
      ) : null}

      {booking.notes ? (
        <>
          <SectionTitle>Notes</SectionTitle>
          <Card>
            <Text style={type.body}>{booking.notes}</Text>
          </Card>
        </>
      ) : null}

      <Card>
        <Row label="Acknowledged by" value={booking.signature_name} />
      </Card>

      <View style={{ gap: space.md }}>
        <Button
          label="Share receipt (PDF)"
          onPress={() => run('receipt', () => shareReceipt(booking))}
          loading={busy === 'receipt'}
        />
        {booking.returned_on ? (
          <Button
            label="Undo returned"
            variant="secondary"
            onPress={() => run('return', () => setReturnedOn(booking.id, null), 'Marked as not returned.')}
            loading={busy === 'return'}
          />
        ) : state !== 'upcoming' ? (
          <Button
            label="Mark dress returned today"
            variant="secondary"
            onPress={() =>
              run(
                'return',
                () => setReturnedOn(booking.id, today),
                `Marked returned. The dress is free again from ${formatDate(availableFrom({ ...booking, returned_on: today }, today))}.`,
              )
            }
            loading={busy === 'return'}
          />
        ) : null}
        <ReviewButton />

        {confirmCancel ? (
          <Card style={{ borderColor: colors.critical }}>
            <Text style={type.body}>Cancel this booking? The dress will be free for these dates again.</Text>
            <View style={styles.paymentRow}>
              <Button label="Keep booking" variant="secondary" onPress={() => setConfirmCancel(false)} style={{ flex: 1 }} />
              <Button
                label="Cancel booking"
                variant="danger"
                style={{ flex: 1 }}
                loading={busy === 'delete'}
                onPress={() =>
                  run(
                    'delete',
                    async () => {
                      await deleteBooking(booking.id);
                      router.back();
                    },
                    undefined,
                    false,
                  )
                }
              />
            </View>
          </Card>
        ) : (
          <Button label="Cancel booking" variant="ghost" onPress={() => setConfirmCancel(true)} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  photo: { width: 96, height: 128, borderRadius: radius.md },
  dress: { fontSize: 14, fontWeight: '600', color: colors.accent },
  paymentRow: { flexDirection: 'row', gap: space.md },
});
