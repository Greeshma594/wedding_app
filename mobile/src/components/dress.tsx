import { Image, Pressable, StyleSheet, Text, View, type ImageStyle } from 'react-native';

import { photoUrl } from '../lib/api';
import type { Dress } from '../lib/types';
import { colors, radius, space } from '../theme';

export function DressPhoto({ path, style }: { path: string | null; style: ImageStyle }) {
  const uri = photoUrl(path);
  if (!uri) {
    return (
      <View style={[style, styles.placeholder]}>
        <Text style={{ color: colors.muted, fontSize: 12 }}>No photo</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={style} resizeMode="cover" />;
}

/** Two-column grid of dress thumbnails. */
export function DressGrid({ dresses, onPress }: { dresses: Dress[]; onPress: (dress: Dress) => void }) {
  return (
    <View style={styles.grid}>
      {dresses.map((d) => (
        <Pressable
          key={d.id}
          accessibilityRole="button"
          accessibilityLabel={`${d.code} ${d.name}`}
          onPress={() => onPress(d)}
          style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}>
          <DressPhoto path={d.thumb_path} style={styles.tilePhoto} />
          <View style={styles.tileText}>
            <Text style={styles.code}>{d.code}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {d.name}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.md },
  tile: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  tilePhoto: { width: '100%', aspectRatio: 3 / 4 },
  tileText: { padding: space.sm, gap: 2 },
  code: { fontSize: 12, fontWeight: '700', color: colors.accent },
  name: { fontSize: 14, color: colors.ink },
});
