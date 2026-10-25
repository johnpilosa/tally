import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { floatIn } from '@/animations/presets';
import { AppSwitcher } from '@/components/app-switcher';
import { BlurOverlay } from '@/components/blur-overlay';
import { BouncePressable } from '@/components/bounce-pressable';
import { GamesTabBar } from '@/components/games-nav';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { useGames, type Game } from '@/lib/games';
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

  const shown = games.filter((g) => {
    if (filter === 'all') return true;
    if (filter === 'playing' || filter === 'played') return g.status === filter;
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
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topBar}>
          <AppSwitcher current="games" />
          <Pressable hitSlop={12} onPress={() => router.push('/games/search')}>
            <Text style={styles.link}>{t.games.add}</Text>
          </Pressable>
        </View>

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
            <Text style={styles.heading}>{t.games.myGames}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersScroll}
              contentContainerStyle={styles.filters}>
              {filters.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => setFilter(f.id)}
                  style={[styles.chip, filter === f.id && styles.chipActive]}>
                  {filter === f.id && <View style={styles.dot} />}
                  <Text style={[styles.chipText, filter === f.id && styles.chipTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.list}>
              {shown.length === 0 && <Text style={styles.label}>{t.games.emptyFilter}</Text>}
              {shown.map((g, i) => (
                <GameRow
                  key={g.id}
                  game={g}
                  index={i}
                  onToggleFavorite={() => updateGame(g.id, { favorite: !g.favorite })}
                  onLists={() => setListsFor(g.id)}
                />
              ))}
            </ScrollView>
          </>
        )}
      </SafeAreaView>
      <GamesTabBar current="games" />

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
    overall ? '★'.repeat(overall) : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <Animated.View
      entering={floatIn({ index: Math.min(index, 8) })}
      layout={LinearTransition}
      style={styles.row}>
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
    </Animated.View>
  );
}

/** Ventana para marcar en qué listas está un juego, y crear listas nuevas. */
function ListPicker({ gameId, onClose }: { gameId: string | null; onClose: () => void }) {
  const { t } = useI18n();
  const { games, lists, createList, toggleInList } = useGames();
  const insets = useSafeAreaInsets();
  const game = games.find((g) => g.id === gameId);

  const create = (name: string) => {
    if (!game) return;
    const id = createList(name);
    toggleInList(game.id, id);
  };

  return (
    <BlurOverlay visible={!!game} onClose={onClose}>
      <View style={[styles.popupWrap, { paddingTop: insets.top }]} pointerEvents="box-none">
        <Animated.View entering={floatIn()} style={styles.popup}>
          <Text style={styles.label}>{t.games.addToList}</Text>
          <Text style={styles.popupTitle} numberOfLines={2}>
            {game?.title.toUpperCase()}
          </Text>

          {lists.length === 0 ? (
            <Text style={styles.label}>{t.games.noLists}</Text>
          ) : (
            <View style={styles.listOptions}>
              {lists.map((l) => {
                const on = !!game?.listIds.includes(l.id);
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => game && toggleInList(game.id, l.id)}
                    style={({ pressed }) => [styles.listOption, pressed && { opacity: 0.6 }]}>
                    <View style={[styles.check, on && styles.checkOn]} />
                    <Text style={[styles.chipText, on && styles.chipTextActive]}>
                      {l.name.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <NewListForm onCreate={create} />

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.addFirst, pressed && { opacity: 0.7 }]}>
            <Text style={styles.addFirstText}>{t.games.done}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </BlurOverlay>
  );
}

/**
 * Campo para crear una lista. Guarda lo que escribes por su cuenta: como se dibuja dentro de la
 * ventana flotante, si el texto viniera de afuera llegaría un instante tarde y se perderían letras.
 */
function NewListForm({ onCreate }: { onCreate: (name: string) => void }) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setName('');
  };
  return (
    <View style={styles.newListRow}>
      <TextInput
        value={name}
        onChangeText={setName}
        onSubmitEditing={create}
        placeholder={t.games.listNamePlaceholder}
        placeholderTextColor={C.textSecondary}
        style={styles.newListInput}
      />
      <Pressable
        onPress={create}
        disabled={!name.trim()}
        style={{ opacity: name.trim() ? 1 : 0.3 }}>
        <Text style={styles.link}>{t.games.createList}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  link: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  label: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  heading: {
    fontFamily: Type.dot,
    fontSize: 44,
    lineHeight: 50,
    color: C.text,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.five,
  },
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
  popupWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  popup: {
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 28,
    backgroundColor: C.background,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  popupTitle: { fontFamily: Type.dot, fontSize: 26, lineHeight: 30, color: C.text },
  listOptions: { gap: Spacing.one },
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  check: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: C.textSecondary },
  checkOn: { backgroundColor: C.text, borderColor: C.text },
  newListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  newListInput: { flex: 1, minHeight: 44, fontFamily: Type.mono, fontSize: 12, color: C.text },
});
