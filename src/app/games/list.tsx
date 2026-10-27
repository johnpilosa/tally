import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Appear } from '@/animations/appear';
import { GamesMenuButton } from '@/components/games-nav';
import { RemovePopup } from '@/components/remove-popup';
import { ScreenHeader, ScreenTitle } from '@/components/screen-header';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { useGames, type Game } from '@/lib/games';
import { useFocusKey } from '@/hooks/use-focus-key';
import { useI18n } from '@/lib/i18n';
import { yearOf } from '@/lib/wiki-games';

const C = Colors.dark;

/**
 * Los juegos de una lista. Tocar uno abre su reseña; ✕ o mantenerlo presionado lo saca de la
 * lista (lo segundo pide confirmar).
 */
export default function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { games, lists, loaded, toggleInList } = useGames();
  const list = lists.find((l) => l.id === id);
  const inList = games.filter((g) => g.listIds.includes(id));
  const focusKey = useFocusKey();
  const [removing, setRemoving] = useState<Game | null>(null);

  return (
    <View style={styles.screen}>
      <ScreenHeader back="/games/lists" right={<GamesMenuButton />} />
      {!list ? (
        <View style={styles.center}>
          {loaded && <Text style={styles.label}>{t.games.listMissing}</Text>}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View key={focusKey} style={{ gap: Spacing.three }}>
            <Appear>
              <ScreenTitle>{list.name.toUpperCase()}</ScreenTitle>
              <Text style={styles.label}>{t.games.gamesCount(inList.length)}</Text>
            </Appear>

            {inList.length === 0 && <Text style={styles.label}>{t.games.listEmpty}</Text>}

            {inList.map((g, i) => (
              <Appear key={g.id} options={{ index: Math.min(i + 1, 8) }} style={styles.row}>
                <Pressable
                  onPress={() => router.push({ pathname: '/games/review', params: { id: g.id } })}
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setRemoving(g);
                  }}
                  style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.6 }]}>
                  {g.coverUrl ? (
                    <Image source={{ uri: g.coverUrl }} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <View style={styles.thumb} />
                  )}
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {g.title.toUpperCase()}
                    </Text>
                    <Text style={styles.label}>
                      {[
                        t.games[g.status],
                        (g.platforms ?? []).join(' / ').toUpperCase() || null,
                        yearOf(g.description),
                      ]
                        .filter(Boolean)
                        .join('  ·  ')}
                    </Text>
                  </View>
                </Pressable>
                <Pressable hitSlop={10} onPress={() => toggleInList(g.id, list.id)}>
                  <Text style={styles.label}>✕</Text>
                </Pressable>
              </Appear>
            ))}
          </View>
        </ScrollView>
      )}

      <RemovePopup
        title={removing?.title ?? null}
        label={t.games.removeFrom(list?.name.toUpperCase() ?? '')}
        onConfirm={() => removing && list && toggleInList(removing.id, list.id)}
        onClose={() => setRemoving(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  label: { fontFamily: Type.mono, fontSize: 10, color: C.textSecondary, letterSpacing: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: C.backgroundElement,
    borderRadius: 20,
    padding: Spacing.three,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  thumb: { width: 44, aspectRatio: 2 / 3, borderRadius: 6, backgroundColor: C.backgroundSelected },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
});
