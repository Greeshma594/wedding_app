import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReviewButton } from '../components/ReviewButton';
import { Button } from '../components/ui';
import { config } from '../lib/config';
import { supabase } from '../lib/supabase';
import { SECTIONS, type Section } from '../lib/types';
import { colors, radius, space, type } from '../theme';

const TILE_COLORS: Record<Section, { bg: string; fg: string }> = {
  wear: { bg: colors.accentSoft, fg: colors.accent },
  guest: { bg: colors.goldSoft, fg: colors.gold },
};

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={{ gap: space.xs }}>
          <Text style={styles.shop}>{config.shopName}</Text>
          <Text style={[type.small, { textAlign: 'center' }]}>Choose a section</Text>
        </View>

        {(Object.keys(SECTIONS) as Section[]).map((section) => (
          <Pressable
            key={section}
            accessibilityRole="button"
            onPress={() => router.push(`/${section}`)}
            style={({ pressed }) => [styles.tile, { backgroundColor: TILE_COLORS[section].bg }, pressed && { opacity: 0.85 }]}>
            <Text style={[styles.tileTitle, { color: TILE_COLORS[section].fg }]}>{SECTIONS[section].title}</Text>
            <Text style={type.small}>{SECTIONS[section].subtitle}</Text>
          </Pressable>
        ))}

        <ReviewButton />
      </View>
      <Button label="Sign out" variant="ghost" onPress={() => supabase.auth.signOut()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: space.lg },
  content: { flex: 1, justifyContent: 'center', gap: space.lg, maxWidth: 480, width: '100%', alignSelf: 'center' },
  shop: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
  },
  tile: { borderRadius: radius.lg, paddingVertical: space.xxl, paddingHorizontal: space.xl, gap: space.xs },
  tileTitle: { fontSize: 24, fontWeight: '700' },
});
