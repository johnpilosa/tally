import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Appear } from '@/animations/appear';
import { FilterSwitch } from '@/animations/config';
import { BouncePressable } from '@/components/bounce-pressable';
import { LapChip } from '@/components/lap-chip';
import { ListPicker } from '@/components/list-picker';
import { ScreenHeader, ScreenTitle } from '@/components/screen-header';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useGames, type Game } from '@/lib/games';
import { useFocusKey } from '@/hooks/use-focus-key';
import { useI18n } from '@/lib/i18n';
import { yearOf } from '@/lib/wiki-games';

const C = Colors.dark;

type Filter = 'all' | 'playing' | 'played' | 'favorites';

/** Mis juegos: la lista, con filtros por estado, favoritos y listas propias. */
export default function MyGamesScreen() {
  const { t } = useI18n();
  const { games, loaded, updateGame } = useGames();
  const [filter, setFilter] = useState<Filter>('all');
  const [listsFor, setListsFor] = useState<string | null>(null);
  const focusKey = useFocusKey();

  // El chip cambia al instante; la lista espera a que la anterior se desvanezca y recién
  // entonces muestra el nuevo filtro (que entra con su animación).
  const [listFilter, setListFilter] = useState<Filter>('all');
  const listOpacity = useSharedValue(1);
  const listStyle = useAnimatedStyle(() => ({ opacity: listOpacity.get() }));
  const switchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => clearTimeout(switchTimer.current ?? undefined), []);

  const pickFilter = (next: Filter) => {
    if (next === filter) return;
    setFilter(next);
    listOpacity.set(withTiming(0, { duration: FilterSwitch.leave }));
    clearTimeout(switchTimer.current ?? undefined);
    switchTimer.current = setTimeout(() => {
      setListFilter(next);
      listOpacity.set(1);
    }, FilterSwitch.leave);
  };

  const shown = games.filter((g) => {
    if (listFilter === 'all') return true;
    if (listFilter === 'playing' || listFilter === 'played') return g.status === listFilter;
    return g.favorite;
  });

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t.games.all },
    { id: 'playing', label: t.games.playing },
    { id: 'played', label: t.games.played },
    { id: 'favorites', label: t.games.favorites },
  ];

  return (
    <View style={styles.screen}>
      <ScreenHeader
        app="games"
        right={
          <Pressable hitSlop={12} onPress={() => router.push('/games/search')}>
            <Text style={styles.link}>{t.games.add}</Text>
          </Pressable>
        }
      />
      <View style={styles.body}>
        {loaded && games.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t.games.emptyTitle}</Text>
            <Text style={styles.label}>{t.games.emptyHint}</Text>
            <Pressable
              onPress={() => router.push('/games/search')}
              style={({ pressed }) => [styles.addFirst, pressed && { opacity: 0.7 }]}>
              <Text style={styles.addFirstText}>{t.games.addGame}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.titleWrap}>
              <ScreenTitle rule>{t.games.myGames}</ScreenTitle>
            </View>
            <Appear options={{ index: 1 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersScroll}
                contentContainerStyle={styles.filters}>
                {filters.map((f) => (
                  <LapChip key={f.id} active={filter === f.id} onPress={() => pickFilter(f.id)}>
                    {filter === f.id && <View style={styles.dot} />}
                    <Text style={[styles.chipText, filter === f.id && styles.chipTextActive]}>
                      {f.label}
                    </Text>
                  </LapChip>
                ))}
              </ScrollView>
            </Appear>

            <ScrollView contentContainerStyle={styles.list}>
              {/* Cambiar de filtro o volver a la pantalla vuelve a animar la lista. */}
              <Animated.View
                key={`${listFilter}-${focusKey}`}
                style={[{ gap: Spacing.two }, listStyle]}>
                {shown.length === 0 && (
                  <Appear>
                    <Text style={styles.label}>{t.games.emptyFilter}</Text>
                  </Appear>
                )}
                {shown.map((g, i) => (
                  <GameRow
                    key={g.id}
                    game={g}
                    index={i}
                    onToggleFavorite={() => updateGame(g.id, { favorite: !g.favorite })}
                    onLists={() => setListsFor(g.id)}
                  />
                ))}
              </Animated.View>
            </ScrollView>
          </>
        )}
      </View>

      <ListPicker gameId={listsFor} onClose={() => setListsFor(null)} />
    </View>
  );
}

function GameRow({
  game,
  index,
  onToggleFavorite,
  onLists,
}: {
  game: Game;
  index: number;
  onToggleFavorite: () => void;
  onLists: () => void;
}) {
  const { t } = useI18n();
  const overall = game.ratings.overall;
  const meta = [
    t.games[game.status],
    yearOf(game.description),
    overall ? '★'.repeat(Math.floor(overall)) + (overall % 1 ? '½' : '') : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <Appear options={{ index: Math.min(index, 8) }} style={styles.row}>
      <Pressable
        onPress={() => router.push({ pathname: '/games/review', params: { id: game.id } })}
        style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.6 }]}>
        {game.coverUrl ? (
          <Image source={{ uri: game.coverUrl }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={styles.thumb} />
        )}
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {game.title.toUpperCase()}
          </Text>
          <Text style={styles.label}>{meta}</Text>
        </View>
      </Pressable>
      <BouncePressable
        hitSlop={8}
        onPress={onToggleFavorite}
        accessibilityLabel={t.games.favorite}
        accessibilityState={{ selected: game.favorite }}
        style={[styles.iconButton, game.favorite && { borderColor: C.accent }]}>
        <Text style={[styles.iconText, game.favorite && { color: C.accent }]}>♥</Text>
      </BouncePressable>
      <BouncePressable
        hitSlop={8}
        onPress={onLists}
        accessibilityLabel={t.games.addToList}
        style={[styles.iconButton, game.listIds.length > 0 && { borderColor: C.text }]}>
        <Text style={[styles.iconText, game.listIds.length > 0 && { color: C.text }]}>≡</Text>
      </BouncePressable>
    </Appear>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  body: { flex: 1, width: '100%', maxWidth: Layout.maxWidth, alignSelf: 'center' },
  titleWrap: { paddingHorizontal: Layout.gutter },
  link: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  label: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  emptyTitle: { fontFamily: Type.dot, fontSize: 32, color: C.text, textAlign: 'center' },
  addFirst: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: C.text,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  addFirstText: { fontFamily: Type.mono, fontSize: 13, color: C.text, letterSpacing: 2 },
  filtersScroll: { flexGrow: 0 },
  filters: { gap: Spacing.two, paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipActive: { borderColor: C.text },
  chipText: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  chipTextActive: { color: C.text },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Spacing.three,
    padding: Spacing.two,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  thumb: {
    width: 48,
    aspectRatio: 2 / 3,
    borderRadius: 6,
    backgroundColor: C.backgroundElement,
  },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: Type.mono, fontSize: 13, color: C.text, letterSpacing: 1 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 16, color: C.textSecondary },
});
