import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import { popIn } from '@/animations/presets';
import { GamesMenuButton } from '@/components/games-nav';
import { ScreenHeader, ScreenTitle } from '@/components/screen-header';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useGames, type GameList } from '@/lib/games';
import { useI18n } from '@/lib/i18n';

const C = Colors.dark;

/** Tus listas ("PS2", "5ta generación"…): crear, renombrar, borrar y abrir cada una. */
export default function ListsScreen() {
  const { t } = useI18n();
  const { lists, createList } = useGames();
  const [name, setName] = useState('');

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createList(trimmed);
    setName('');
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader app="games" right={<GamesMenuButton />} />
      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenTitle>{t.games.listsTitle}</ScreenTitle>

          <View style={styles.newRow}>
            <TextInput
              value={name}
              onChangeText={setName}
              onSubmitEditing={create}
              placeholder={t.games.newListPlaceholder}
              placeholderTextColor={C.textSecondary}
              returnKeyType="done"
              style={styles.newInput}
            />
            <Pressable
              onPress={create}
              disabled={!name.trim()}
              style={{ opacity: name.trim() ? 1 : 0.3 }}>
              <Text style={styles.link}>{t.games.createList}</Text>
            </Pressable>
          </View>

          {lists.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{t.games.noListsYet}</Text>
              <Text style={styles.label}>{t.games.noListsHint}</Text>
            </View>
          ) : (
            lists.map((list, i) => <ListRow key={list.id} list={list} index={i} />)
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function ListRow({ list, index }: { list: GameList; index: number }) {
  const { t } = useI18n();
  const { games, renameList, deleteList } = useGames();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(list.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inList = games.filter((g) => g.listIds.includes(list.id));

  // Al tocar GUARDAR, el campo pierde el foco justo antes del toque y eso ya guarda. Sin este
  // aviso, el toque llegaba después, veía "no editando" y volvía a abrir la edición (el parpadeo).
  const justSaved = useRef(0);

  const saveName = () => {
    const trimmed = draft.trim();
    if (trimmed) renameList(list.id, trimmed);
    else setDraft(list.name);
    setEditing(false);
    justSaved.current = Date.now();
  };

  return (
    <Animated.View
      entering={popIn({ index: Math.min(index, 8) })}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition}
      style={styles.row}>
      <Pressable
        onPress={() =>
          !editing && router.push({ pathname: '/games/list', params: { id: list.id } })
        }
        style={({ pressed }) => [styles.rowMain, pressed && !editing && { opacity: 0.6 }]}>
        <Covers urls={inList.map((g) => g.coverUrl)} />
        <View style={styles.rowText}>
          {editing ? (
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={saveName}
              onBlur={saveName}
              autoFocus
              selectTextOnFocus
              style={styles.renameInput}
            />
          ) : (
            <Text style={styles.rowTitle} numberOfLines={1}>
              {list.name.toUpperCase()}
            </Text>
          )}
          <Text style={styles.label}>{t.games.gamesCount(inList.length)}</Text>
        </View>
      </Pressable>

      <View style={styles.rowActions}>
        <Pressable
          hitSlop={8}
          onPress={() => {
            if (editing) saveName();
            else if (Date.now() - justSaved.current > 400) setEditing(true);
          }}
          style={styles.action}>
          <Text style={styles.actionText}>{editing ? t.save : t.games.rename}</Text>
        </Pressable>
        <Pressable
          hitSlop={8}
          onPress={() => (confirmDelete ? deleteList(list.id) : setConfirmDelete(true))}
          onBlur={() => setConfirmDelete(false)}
          style={styles.action}>
          <Text style={[styles.actionText, { color: C.accent }]}>
            {confirmDelete ? t.confirmAgain : t.games.deleteList}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

/** Hasta 3 portadas de la lista, una encima de otra como un mazo. */
function Covers({ urls }: { urls: (string | null)[] }) {
  const shown = urls.filter(Boolean).slice(0, 3) as string[];
  return (
    <View style={styles.covers}>
      {shown.length === 0 && <View style={styles.cover} />}
      {shown.map((url, i) => (
        <Image
          key={url}
          source={{ uri: url }}
          contentFit="cover"
          style={[
            styles.cover,
            {
              position: 'absolute',
              left: i * 10,
              top: i * 3,
              zIndex: 3 - i,
              opacity: 1 - i * 0.25,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  body: { flex: 1, width: '100%', maxWidth: Layout.maxWidth, alignSelf: 'center' },
  content: { paddingHorizontal: Layout.gutter, paddingBottom: Spacing.six, gap: Spacing.three },
  link: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  label: { fontFamily: Type.mono, fontSize: 10, color: C.textSecondary, letterSpacing: 1 },
  newRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  newInput: { flex: 1, minHeight: 48, fontFamily: Type.mono, fontSize: 12, color: C.text },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.six },
  emptyTitle: { fontFamily: Type.dot, fontSize: 28, color: C.text, textAlign: 'center' },
  row: {
    backgroundColor: C.backgroundElement,
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: Type.dot, fontSize: 24, lineHeight: 28, color: C.text },
  renameInput: {
    fontFamily: Type.dot,
    fontSize: 24,
    color: C.text,
    borderBottomWidth: 1,
    borderBottomColor: C.textSecondary,
    paddingVertical: 2,
  },
  rowActions: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'flex-end' },
  action: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  actionText: { fontFamily: Type.mono, fontSize: 10, color: C.text, letterSpacing: 1 },
  covers: { width: 62, height: 66 },
  cover: {
    width: 42,
    aspectRatio: 2 / 3,
    borderRadius: 6,
    backgroundColor: C.backgroundSelected,
  },
});
