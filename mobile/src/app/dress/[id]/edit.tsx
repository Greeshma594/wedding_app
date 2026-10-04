import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DressDetailsFields, draftFromDress, readDraft, type DressDraft } from '../../../components/DressForm';
import { DressPhoto } from '../../../components/dress';
import { Button, Loading, Message, Screen } from '../../../components/ui';
import { getDress, listDresses, updateDress } from '../../../lib/api';
import { collectTags } from '../../../lib/catalogue';
import type { Dress } from '../../../lib/types';
import { colors, radius, space, type } from '../../../theme';

export default function EditDressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [dress, setDress] = useState<Dress | null>(null);
  const [draft, setDraft] = useState<DressDraft | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDress(id)
      .then(async (d) => {
        setDress(d);
        setDraft(draftFromDress(d));
        setSuggestions(collectTags(await listDresses(d.section)));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load this dress.'));
  }, [id]);

  if (error && !dress) return <Screen><Message>{error}</Message></Screen>;
  if (!dress || !draft) return <Loading />;

  const save = async () => {
    const read = readDraft(draft);
    if ('error' in read) return setError(read.error);
    setSaving(true);
    setError(null);
    try {
      await updateDress(dress.id, read.details);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the changes.');
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: `Edit ${dress.code}` }} />
      <View style={styles.header}>
        <DressPhoto path={dress.thumb_path} style={styles.photo} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.code}>{dress.code}</Text>
          <Text style={type.small}>The code stays the same. Change the details below.</Text>
        </View>
      </View>
      <DressDetailsFields draft={draft} onChange={setDraft} tagSuggestions={suggestions} />
      {error ? <Message>{error}</Message> : null}
      <Button label="Save changes" onPress={save} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  photo: { width: 64, height: 80, borderRadius: radius.sm },
  code: { fontSize: 18, fontWeight: '700', color: colors.accent },
});
