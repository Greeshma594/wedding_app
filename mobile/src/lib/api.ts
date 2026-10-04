import { findConflicts } from './blocking';
import { addDays, formatDate, todayISO, type ISODate } from './dates';
import { preparePhoto } from './images';
import { supabase } from './supabase';
import type { Booking, BookingWithDress, Dress, NewBooking, Section } from './types';

const BUCKET = 'dresses';
const BOOKING_WITH_DRESS = '*, dress:dresses!inner(*)';

function fail(error: { message: string } | null, fallback: string): never {
  throw new Error(error?.message || fallback);
}

function toDress(row: Dress): Dress {
  return { ...row, price: row.price === null ? null : Number(row.price), tags: row.tags ?? [] };
}

function toBooking<T extends Booking>(row: T): T {
  return {
    ...row,
    total_price: Number(row.total_price),
    amount_collected: Number(row.amount_collected),
    balance_due: Number(row.balance_due),
  };
}

function toBookingWithDress(row: BookingWithDress): BookingWithDress {
  return { ...toBooking(row), dress: toDress(row.dress) };
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export function photoUrl(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** The dress photo as a data: URI, for embedding in the PDF receipt. */
export async function photoDataUri(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(data);
  });
}

// ─── Dresses ──────────────────────────────────────────────────────────────────

export async function listDresses(section: Section): Promise<Dress[]> {
  const { data, error } = await supabase
    .from('dresses')
    .select('*')
    .eq('section', section)
    .order('created_at', { ascending: false });
  if (error) fail(error, 'Could not load the catalogue.');
  return (data as Dress[]).map(toDress);
}

export async function getDress(id: string): Promise<Dress> {
  const { data, error } = await supabase.from('dresses').select('*').eq('id', id).single();
  if (error) fail(error, 'Could not load this dress.');
  return toDress(data as Dress);
}

/** The details staff can set and edit. The code is given by the database. */
export interface DressDetails {
  name: string;
  size: string | null;
  price: number | null;
  tags: string[];
  notes: string | null;
}

export interface NewDress extends DressDetails {
  section: Section;
}

/**
 * Compresses the photo on the phone, uploads the full photo and thumbnail,
 * then saves the dress. Reports each step through onStep.
 */
export async function createDress(
  input: NewDress,
  photoUri: string,
  onStep: (step: string) => void = () => {},
): Promise<Dress> {
  onStep('Compressing photo…');
  const { full, thumb } = await preparePhoto(photoUri);

  onStep('Saving dress…');
  const { data: dress, error } = await supabase.from('dresses').insert(input).select('*').single();
  if (error) fail(error, 'Could not save the dress.');

  const base = `${input.section}/${dress.id}`;
  try {
    onStep('Uploading photo…');
    const upload = async (path: string, bytes: Uint8Array) => {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) fail(uploadError, 'Could not upload the photo.');
    };
    await upload(`${base}/full.jpg`, full.bytes);
    await upload(`${base}/thumb.jpg`, thumb.bytes);

    const { data: updated, error: updateError } = await supabase
      .from('dresses')
      .update({ image_path: `${base}/full.jpg`, thumb_path: `${base}/thumb.jpg` })
      .eq('id', dress.id)
      .select('*')
      .single();
    if (updateError) fail(updateError, 'Could not save the photo.');
    return toDress(updated as Dress);
  } catch (e) {
    // Don't leave a dress without a photo behind.
    await supabase.storage.from(BUCKET).remove([`${base}/full.jpg`, `${base}/thumb.jpg`]);
    await supabase.from('dresses').delete().eq('id', dress.id);
    throw e;
  }
}

export async function updateDress(id: string, details: DressDetails): Promise<Dress> {
  const { data, error } = await supabase.from('dresses').update(details).eq('id', id).select('*').single();
  if (error) fail(error, 'Could not save the changes.');
  return toDress(data as Dress);
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

/** Bookings in a section that could block any day from `from` to `to`. */
export async function listBookingsBetween(
  section: Section,
  from: ISODate,
  to: ISODate,
): Promise<BookingWithDress[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_WITH_DRESS)
    .eq('dress.section', section)
    .lte('start_date', to)
    .or(`returned_on.is.null,returned_on.gte.${addDays(from, -1)}`)
    .order('start_date');
  if (error) fail(error, 'Could not load bookings.');
  return (data as BookingWithDress[]).map(toBookingWithDress);
}

export async function listBookings(
  section: Section,
  filter: 'active' | 'returned',
): Promise<BookingWithDress[]> {
  let query = supabase.from('bookings').select(BOOKING_WITH_DRESS).eq('dress.section', section);
  query =
    filter === 'active'
      ? query.is('returned_on', null).order('start_date')
      : query.not('returned_on', 'is', null).order('returned_on', { ascending: false }).limit(100);
  const { data, error } = await query;
  if (error) fail(error, 'Could not load bookings.');
  return (data as BookingWithDress[]).map(toBookingWithDress);
}

export async function listBookingsForDress(dressId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('dress_id', dressId)
    .order('start_date', { ascending: false })
    .limit(50);
  if (error) fail(error, 'Could not load bookings for this dress.');
  return (data as Booking[]).map(toBooking);
}

export async function getBooking(id: string): Promise<BookingWithDress> {
  const { data, error } = await supabase.from('bookings').select(BOOKING_WITH_DRESS).eq('id', id).single();
  if (error) fail(error, 'Could not load this booking.');
  return toBookingWithDress(data as BookingWithDress);
}

export class DressUnavailableError extends Error {}

/** Saves a booking after checking the dress is free, including the 1-day cleaning buffer. */
export async function createBooking(input: NewBooking): Promise<Booking> {
  const { data: existing, error: loadError } = await supabase
    .from('bookings')
    .select('*')
    .eq('dress_id', input.dress_id)
    .or(`returned_on.is.null,returned_on.gte.${addDays(input.start_date, -1)}`);
  if (loadError) fail(loadError, 'Could not check availability.');

  const conflicts = findConflicts(input, (existing as Booking[]) ?? [], todayISO());
  if (conflicts.length > 0) {
    const c = conflicts[0];
    throw new DressUnavailableError(
      `This dress is blocked: booked by ${c.customer_name} from ${formatDate(c.start_date)}, return by ${formatDate(c.return_date)}` +
        (c.returned_on ? '' : '. It must be marked returned first if it is back.') +
        ' Dresses stay blocked 1 day after return for cleaning.',
    );
  }

  const { data, error } = await supabase.from('bookings').insert(input).select('*').single();
  if (error) {
    if (error.message.includes('DRESS_UNAVAILABLE')) {
      throw new DressUnavailableError('Another booking for this dress was just saved for these dates.');
    }
    fail(error, 'Could not save the booking.');
  }
  return toBooking(data as Booking);
}

export async function setAmountCollected(id: string, amount: number): Promise<void> {
  const { error } = await supabase.from('bookings').update({ amount_collected: amount }).eq('id', id);
  if (error) fail(error, 'Could not update the payment.');
}

export async function setReturnedOn(id: string, date: ISODate | null): Promise<void> {
  const { error } = await supabase.from('bookings').update({ returned_on: date }).eq('id', id);
  if (error) fail(error, 'Could not update the return.');
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if (error) fail(error, 'Could not cancel the booking.');
}

/** Calls onChange whenever dresses or bookings change on any staff phone. Returns an unsubscribe function. */
export function subscribeToChanges(onChange: () => void): () => void {
  const channel = supabase
    .channel(`changes-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'dresses' }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
