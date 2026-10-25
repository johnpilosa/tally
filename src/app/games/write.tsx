import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Appear } from '@/animations/appear';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { reviewOf, useGames, type Game, type WrittenReview } from '@/lib/games';
import { useI18n } from '@/lib/i18n';

const C = Colors.dark;

/**
 * Pantalla exclusiva para escribir la reseña: título, subtítulo y cuerpo, sin nada más
 * alrededor. Se guarda sola mientras escribes. La barra de pestañas se esconde aquí.
 */
export default function WriteReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { games, loaded } = useGames();
  const { t } = useI18n();
  const game = games.find((g) => g.id === id);

  if (!game) {
    return (
      <View style={styles.screen}>
        <ScreenHeader back="/games" />
        <View style={styles.center}>
          {loaded && <Text style={styles.label}>{t.games.missing}</Text>}
        </View>
      </View>
    );
  }
  return <Writer key={game.id} game={game} />;
}

function Writer({ game }: { game: Game }) {
  const { updateGame } = useGames();
  const { t } = useI18n();
  // El texto vive aquí mientras escribes (para que nunca se pierda una letra) y se guarda en
  // cada cambio.
  const [draft, setDraft] = useState<WrittenReview>(() => reviewOf(game));

  const change = (changes: Partial<WrittenReview>) => {
    const next = { ...draft, ...changes, updatedAt: Date.now() };
    setDraft(next);
    updateGame(game.id, { review: next });
  };

  const words = draft.body.trim() ? draft.body.trim().split(/\s+/).length : 0;

  const done = () => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/games/review', params: { id: game.id } });
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        back={`/games/review?id=${encodeURIComponent(game.id)}`}
        title={t.games.words(words)}
        right={
          <Pressable hitSlop={12} onPress={done}>
            <Text style={styles.done}>{t.games.done}</Text>
          </Pressable>
        }
      />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={Spacing.four}>
        <Appear>
          <Text style={styles.label} numberOfLines={1}>
            {game.title.toUpperCase()} · {t.games.yourReview}
          </Text>
        </Appear>

        <Appear options={{ index: 1 }}>
          <TextInput
            value={draft.title}
            onChangeText={(title) => change({ title })}
            placeholder={t.games.reviewTitlePlaceholder}
            placeholderTextColor={C.textSecondary}
            multiline
            style={styles.title}
          />
        </Appear>

        <Appear options={{ index: 2 }}>
          <TextInput
            value={draft.subtitle}
            onChangeText={(subtitle) => change({ subtitle })}
            placeholder={t.games.reviewSubtitlePlaceholder}
            placeholderTextColor={C.textSecondary}
            multiline
            style={styles.subtitle}
          />
        </Appear>

        <Appear options={{ index: 3 }} style={styles.divider} />

        <Appear options={{ index: 4 }}>
          <TextInput
            value={draft.body}
            onChangeText={(body) => change({ body })}
            placeholder={t.games.reviewBodyPlaceholder}
            placeholderTextColor={C.textSecondary}
            multiline
            textAlignVertical="top"
            style={styles.body}
          />
        </Appear>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: Layout.gutter,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  label: { fontFamily: Type.mono, fontSize: 10, color: C.textSecondary, letterSpacing: 2 },
  done: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 2 },
  title: {
    fontFamily: Type.dot,
    fontSize: 36,
    lineHeight: 42,
    color: C.text,
    paddingVertical: 0,
  },
  subtitle: {
    fontFamily: Type.mono,
    fontSize: 15,
    lineHeight: 22,
    color: C.textSecondary,
    paddingVertical: 0,
  },
  divider: { height: 1, backgroundColor: C.border, marginVertical: Spacing.two },
  body: {
    fontFamily: Type.mono,
    fontSize: 15,
    lineHeight: 25,
    color: C.text,
    minHeight: 420,
    paddingVertical: 0,
  },
});
