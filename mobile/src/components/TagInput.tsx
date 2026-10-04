import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { addTag, parseTags } from '../lib/catalogue';
import { colors, radius, space, type } from '../theme';

export function TagChip({
  label,
  selected = false,
  onPress,
  removable = false,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  removable?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
        {removable ? '  ✕' : ''}
      </Text>
    </Pressable>
  );
}

/** Type tags separated by commas, tap a chip to remove it, or tap a suggestion to add it. */
export function TagInput({
  tags,
  onChange,
  suggestions,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}) {
  const [text, setText] = useState('');

  const commit = (value: string) => {
    const typed = parseTags(value);
    if (typed.length) onChange(typed.reduce(addTag, tags));
    setText('');
  };

  const onChangeText = (value: string) => {
    // A comma finishes a tag.
    if (/[,\n]/.test(value)) commit(value);
    else setText(value);
  };

  const query = text.trim().toLowerCase();
  const unused = suggestions.filter((s) => !tags.includes(s) && (!query || s.includes(query))).slice(0, 12);

  return (
    <View style={{ gap: space.sm }}>
      <Text style={type.label}>Tags</Text>
      {tags.length > 0 ? (
        <View style={styles.chips}>
          {tags.map((t) => (
            <TagChip key={t} label={t} selected removable onPress={() => onChange(tags.filter((x) => x !== t))} />
          ))}
        </View>
      ) : null}
      <TextInput
        value={text}
        onChangeText={onChangeText}
        onSubmitEditing={() => commit(text)}
        onBlur={() => text.trim() && commit(text)}
        placeholder="red, green, silk…"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        returnKeyType="done"
        style={styles.input}
      />
      <Text style={type.small}>Colours, fabric or style, separated by commas. Used to filter the catalogue.</Text>
      {unused.length > 0 ? (
        <View style={styles.chips}>
          {unused.map((s) => (
            <TagChip key={s} label={`+ ${s}`} onPress={() => onChange(addTag(tags, s))} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 14, color: colors.ink },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    color: colors.ink,
  },
});
