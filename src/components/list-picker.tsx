import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/animations/appear';
import { BlurOverlay } from '@/components/blur-overlay';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useGames } from '@/lib/games';
import { useI18n } from '@/lib/i18n';

const C = Colors.dark;

/** Ventana para marcar en qué listas está un juego, y crear listas nuevas. */
export function ListPicker({ gameId, onClose }: { gameId: string | null; onClose: () => void }) {
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
        <Appear style={styles.popup}>
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
        </Appear>
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
  label: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  link: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
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
  chipText: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  chipTextActive: { color: C.text },
  newListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  newListInput: { flex: 1, minHeight: 44, fontFamily: Type.mono, fontSize: 12, color: C.text },
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
});
