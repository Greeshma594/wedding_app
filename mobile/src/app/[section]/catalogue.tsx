import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { DressGrid } from '../../components/dress';
import { TagChip } from '../../components/TagInput';
import { Button, EmptyState, Field, Loading, Message, Screen } from '../../components/ui';
import { listDresses } from '../../lib/api';
import { EMPTY_FILTER, collectTags, filterDresses, isFilterActive, type CatalogueFilter } from '../../lib/catalogue';
import { config } from '../../lib/config';
import { parseAmount } from '../../lib/format';
import { SECTIONS } from '../../lib/types';
import { useLoader } from '../../lib/useLoader';
import { useSection } from '../../lib/useSection';
import { colors, radius, space, type } from '../../theme';

export default function CatalogueScreen() {
  const section = useSection();
  const { data: dresses, error, loading, reload } = useLoader(() => listDresses(section), [section]);
  const [search, setSearch] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');

  if (loading && !dresses) return <Loading />;

  const filter: CatalogueFilter = {
    search,
    tags,
    minPrice: parseAmount(minText),
    maxPrice: parseAmount(maxText),
  };
  const allTags = collectTags(dresses ?? []);
  const shown = filterDresses(dresses ?? [], filter);
  const active = isFilterActive(filter);

  const clear = () => {
    setSearch(EMPTY_FILTER.search);
    setTags(EMPTY_FILTER.tags);
    setMinText('');
    setMaxText('');
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}>
      <Stack.Screen options={{ title: `${SECTIONS[section].title} catalogue` }} />
      <Button label="+ Add dress" onPress={() => router.push(`/${section}/add-dress`)} />
      {error ? <Message>{error}</Message> : null}

      {dresses && dresses.length === 0 ? (
        <EmptyState
          title="No dresses yet"
          body="Add a dress with its photo, name and tags. It gets a code automatically and appears here straight away."
        />
      ) : null}

      {dresses && dresses.length > 0 ? (
        <>
          <View style={styles.filters}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or code"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              style={styles.search}
            />
            {allTags.length > 0 ? (
              <View style={styles.chips}>
                {allTags.map((t) => (
                  <TagChip
                    key={t}
                    label={t}
                    selected={tags.includes(t)}
                    onPress={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}
                  />
                ))}
              </View>
            ) : null}
            <View style={styles.pair}>
              <View style={{ flex: 1 }}>
                <Field
                  label={`Min price (${config.currencySymbol})`}
                  value={minText}
                  onChangeText={setMinText}
                  keyboardType="decimal-pad"
                  placeholder="Any"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label={`Max price (${config.currencySymbol})`}
                  value={maxText}
                  onChangeText={setMaxText}
                  keyboardType="decimal-pad"
                  placeholder="Any"
                />
              </View>
            </View>
          </View>

          <View style={styles.countRow}>
            <Text style={type.small}>
              {active
                ? `${shown.length} of ${dresses.length} dresses`
                : `${dresses.length} ${dresses.length === 1 ? 'dress' : 'dresses'}`}
            </Text>
            {active ? <Button label="Clear filters" variant="ghost" onPress={clear} style={styles.clear} /> : null}
          </View>

          {shown.length === 0 ? (
            <EmptyState title="No dresses match" body="Try fewer tags or a wider price range." />
          ) : (
            <DressGrid dresses={shown} onPress={(d) => router.push(`/dress/${d.id}`)} />
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
  },
  search: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    color: colors.ink,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  pair: { flexDirection: 'row', gap: space.md },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 },
  clear: { minHeight: 40, paddingHorizontal: 0 },
});
