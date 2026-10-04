import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

import { createDress, type DressDetails } from '../lib/api';
import { parseAmount } from '../lib/format';
import type { Dress, Section } from '../lib/types';
import { colors, radius, space, type } from '../theme';
import { TagInput } from './TagInput';
import { Button, Field, Message } from './ui';

export interface DressDraft {
  name: string;
  size: string;
  price: string;
  tags: string[];
  notes: string;
}

export const emptyDraft = (): DressDraft => ({ name: '', size: '', price: '', tags: [], notes: '' });

export const draftFromDress = (d: Dress): DressDraft => ({
  name: d.name,
  size: d.size ?? '',
  price: d.price === null ? '' : String(d.price),
  tags: d.tags,
  notes: d.notes ?? '',
});

/** Checks the typed details; returns the cleaned details or a message for staff. */
export function readDraft(draft: DressDraft): { details: DressDetails } | { error: string } {
  if (!draft.name.trim()) return { error: 'Give the dress a name, for example "Green anarkali".' };
  const price = draft.price.trim() === '' ? null : parseAmount(draft.price);
  if (draft.price.trim() !== '' && price === null) return { error: 'Enter the rental price as a number.' };
  return {
    details: {
      name: draft.name.trim(),
      size: draft.size.trim() || null,
      price,
      tags: draft.tags,
      notes: draft.notes.trim() || null,
    },
  };
}

/** Name, rental price, size, tags and notes. */
export function DressDetailsFields({
  draft,
  onChange,
  tagSuggestions,
}: {
  draft: DressDraft;
  onChange: (draft: DressDraft) => void;
  tagSuggestions: string[];
}) {
  const set = (patch: Partial<DressDraft>) => onChange({ ...draft, ...patch });
  return (
    <>
      <Field label="Dress name" value={draft.name} onChangeText={(name) => set({ name })} placeholder="Green anarkali" />
      <View style={styles.pair}>
        <View style={{ flex: 1 }}>
          <Field
            label="Rental price"
            value={draft.price}
            onChangeText={(price) => set({ price })}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Size" value={draft.size} onChangeText={(size) => set({ size })} placeholder="M" />
        </View>
      </View>
      <TagInput tags={draft.tags} onChange={(tags) => set({ tags })} suggestions={tagSuggestions} />
      <Field
        label="Notes"
        value={draft.notes}
        onChangeText={(notes) => set({ notes })}
        multiline
        placeholder="Fabric, work, accessories included…"
      />
    </>
  );
}

/**
 * Photo plus details for a new dress. Saving compresses and uploads the photo,
 * and the dress goes into the section's catalogue with the next automatic code.
 */
export function NewDressForm({
  section,
  tagSuggestions,
  onSaved,
  saveLabel = 'Save dress',
}: {
  section: Section;
  tagSuggestions: string[];
  onSaved: (dress: Dress) => void;
  saveLabel?: string;
}) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [draft, setDraft] = useState<DressDraft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const prefix = section === 'wear' ? 'WW' : 'WG';

  const pick = async (source: 'camera' | 'library') => {
    setError(null);
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('Camera access is off. Turn it on in the phone settings, or choose a photo from the library.');
        return;
      }
    }
    // Full quality here: the app does its own compression before upload.
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const save = async () => {
    if (!photoUri) return setError('Add a photo of the dress.');
    const read = readDraft(draft);
    if ('error' in read) return setError(read.error);
    setError(null);
    try {
      onSaved(await createDress({ section, ...read.details }, photoUri, setStep));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the dress.');
    } finally {
      setStep(null);
    }
  };

  return (
    <View style={{ gap: space.lg }}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
      ) : (
        <View style={[styles.preview, styles.placeholder]}>
          <Text style={type.small}>No photo yet</Text>
        </View>
      )}
      <View style={styles.pair}>
        {Platform.OS !== 'web' ? (
          <Button label="Take photo" variant="secondary" onPress={() => pick('camera')} style={{ flex: 1 }} />
        ) : null}
        <Button label="Choose photo" variant="secondary" onPress={() => pick('library')} style={{ flex: 1 }} />
      </View>
      <Message tone="info">
        The dress code is given automatically when you save, like {prefix}-001, {prefix}-002.
      </Message>

      <DressDetailsFields draft={draft} onChange={setDraft} tagSuggestions={tagSuggestions} />

      {error ? <Message>{error}</Message> : null}
      {step ? <Message tone="info">{step}</Message> : null}
      <Button label={saveLabel} onPress={save} loading={step !== null} />
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', aspectRatio: 3 / 4, maxHeight: 300, borderRadius: radius.lg, alignSelf: 'center' },
  placeholder: { backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  pair: { flexDirection: 'row', gap: space.md },
});
