import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

import { Button, Field, Message, Screen } from '../../components/ui';
import { createDress } from '../../lib/api';
import { SECTIONS } from '../../lib/types';
import { useSection } from '../../lib/useSection';
import { colors, radius, space, type } from '../../theme';

export default function AddDressScreen() {
  const section = useSection();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [colour, setColour] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);

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
    if (!code.trim()) return setError('Enter a dress code, for example WW-014.');
    if (!name.trim()) return setError('Enter a name for the dress.');
    setError(null);
    try {
      const dress = await createDress(
        {
          section,
          code: code.trim().toUpperCase(),
          name: name.trim(),
          size: size.trim() || null,
          colour: colour.trim() || null,
          notes: notes.trim() || null,
        },
        photoUri,
        setStep,
      );
      router.replace(`/dress/${dress.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the dress.');
    } finally {
      setStep(null);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: `Add to ${SECTIONS[section].title}` }} />

      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
      ) : (
        <View style={[styles.preview, styles.placeholder]}>
          <Text style={type.small}>No photo yet</Text>
        </View>
      )}
      <View style={styles.photoButtons}>
        {Platform.OS !== 'web' ? (
          <Button label="Take photo" variant="secondary" onPress={() => pick('camera')} style={{ flex: 1 }} />
        ) : null}
        <Button label="Choose photo" variant="secondary" onPress={() => pick('library')} style={{ flex: 1 }} />
      </View>
      <Text style={type.small}>Photos are shrunk on the phone before upload to save storage.</Text>

      <Field label="Dress code" value={code} onChangeText={setCode} placeholder="WW-014" autoCapitalize="characters" />
      <Field label="Name" value={name} onChangeText={setName} placeholder="Ivory lehenga" />
      <View style={styles.pair}>
        <View style={{ flex: 1 }}>
          <Field label="Size" value={size} onChangeText={setSize} placeholder="M" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Colour" value={colour} onChangeText={setColour} placeholder="Ivory" />
        </View>
      </View>
      <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Fabric, work, accessories included…" />

      {error ? <Message>{error}</Message> : null}
      {step ? <Message tone="info">{step}</Message> : null}
      <Button label="Save dress" onPress={save} loading={step !== null} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', aspectRatio: 3 / 4, maxHeight: 420, borderRadius: radius.lg, alignSelf: 'center' },
  placeholder: { backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  photoButtons: { flexDirection: 'row', gap: space.md },
  pair: { flexDirection: 'row', gap: space.md },
});
