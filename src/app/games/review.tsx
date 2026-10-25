import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { GamesMenuButton } from '@/components/games-nav';
import { ScreenHeader } from '@/components/screen-header';
import { StarRating } from '@/components/star-rating';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { newId, RatingCategories, useGames, type Game } from '@/lib/games';
import { useNow } from '@/hooks/use-now';
import { useI18n } from '@/lib/i18n';
import { formatDate } from '@/lib/time';

const C = Colors.dark;

/** La reseña de un juego: notas, insights y puntajes. Todo se guarda solo al escribir. */
export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { games, loaded } = useGames();
  const { t } = useI18n();
  const game = games.find((g) => g.id === id);

  if (!game) {
    return (
      <View style={styles.screen}>
        <ScreenHeader back="/games" title={t.games.reviewTitle} right={<GamesMenuButton />} />
        <View style={[styles.screen, styles.center]}>
          {loaded && <Text style={styles.label}>{t.games.missing}</Text>}
        </View>
      </View>
    );
  }
  return <Review key={game.id} game={game} />;
}

function Review({ game }: { game: Game }) {
  const { updateGame, removeGame } = useGames();
  const { t, lang } = useI18n();
  const now = useNow();
  const [insight, setInsight] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  const update = (changes: Partial<Game>) => updateGame(game.id, changes);

  const addInsight = () => {
    const text = insight.trim();
    if (!text) return;
    update({ insights: [{ id: newId(), text, createdAt: Date.now() }, ...game.insights] });
    setInsight('');
  };

  const setRating = (key: keyof Game['ratings'], value: number | undefined) =>
    update({ ratings: { ...game.ratings, [key]: value } });

  const onRemove = () => {
    if (!confirmRemove) return setConfirmRemove(true);
    removeGame(game.id);
    router.back();
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader back="/games" title={t.games.reviewTitle} right={<GamesMenuButton />} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Encabezado: portada, título, estado y favorito */}
        <Animated.View entering={FadeInDown.duration(250)} style={styles.header}>
          {game.coverUrl ? (
            <Image source={{ uri: game.coverUrl }} style={styles.cover} contentFit="cover" />
          ) : (
            <View style={styles.cover} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={3}>
              {game.title.toUpperCase()}
            </Text>
            <View style={styles.chips}>
              {(['playing', 'played'] as const).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => update({ status: s })}
                  style={[styles.chip, game.status === s && styles.chipActive]}>
                  <Text style={[styles.chipText, game.status === s && styles.chipTextActive]}>
                    {t.games[s]}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => update({ favorite: !game.favorite })}
                accessibilityLabel={t.games.favorite}
                accessibilityState={{ selected: game.favorite }}
                style={[styles.chip, game.favorite && styles.chipFavorite]}>
                <Text style={[styles.chipText, game.favorite && { color: C.accent }]}>♥</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Notas */}
        <Section label={t.games.notes}>
          <TextInput
            value={game.notes}
            onChangeText={(notes) => update({ notes })}
            multiline
            placeholder={t.games.notesPlaceholder}
            placeholderTextColor={C.textSecondary}
            style={styles.notes}
            textAlignVertical="top"
          />
        </Section>

        {/* Insights */}
        <Section label={t.games.insights}>
          <View style={styles.insightRow}>
            <TextInput
              value={insight}
              onChangeText={setInsight}
              onSubmitEditing={addInsight}
              placeholder={t.games.insightPlaceholder}
              placeholderTextColor={C.textSecondary}
              returnKeyType="done"
              style={styles.insightInput}
            />
            <Pressable
              onPress={addInsight}
              disabled={!insight.trim()}
              style={{ opacity: insight.trim() ? 1 : 0.3 }}>
              <Text style={styles.link}>{t.games.addInsight}</Text>
            </Pressable>
          </View>
          {game.insights.length === 0 ? (
            <Text style={styles.label}>{t.games.noInsights}</Text>
          ) : (
            game.insights.map((ins) => (
              <Animated.View
                key={ins.id}
                entering={FadeInDown.duration(200)}
                layout={LinearTransition}
                style={styles.insight}>
                <View style={styles.dot} />
                <View style={styles.insightBody}>
                  <Text style={styles.insightText}>{ins.text}</Text>
                  <Text style={styles.label}>
                    {formatDate(ins.createdAt, now, lang).toUpperCase()}
                  </Text>
                </View>
                <Pressable
                  hitSlop={10}
                  onPress={() =>
                    update({ insights: game.insights.filter((x) => x.id !== ins.id) })
                  }>
                  <Text style={styles.label}>✕</Text>
                </Pressable>
              </Animated.View>
            ))
          )}
        </Section>

        {/* Puntajes */}
        <Section label={t.games.ratings}>
          {RatingCategories.map((cat) => (
            <View key={cat} style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>{t.games.categories[cat]}</Text>
              <StarRating
                label={t.games.categories[cat]}
                value={game.ratings[cat]}
                onChange={(v) => setRating(cat, v)}
              />
            </View>
          ))}
          <View style={[styles.ratingRow, styles.overallRow]}>
            <Text style={styles.overallLabel}>{t.games.overall}</Text>
            <StarRating
              label={t.games.overall}
              value={game.ratings.overall}
              onChange={(v) => setRating('overall', v)}
              size={30}
              color={C.accent}
            />
          </View>
        </Section>

        <Pressable onPress={onRemove} style={styles.remove}>
          <Text style={[styles.label, { color: C.accent }]}>
            {confirmRemove ? t.confirmAgain : t.games.removeGame}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.delay(100).duration(250)} style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', gap: Spacing.three },
  cover: {
    width: 96,
    aspectRatio: 2 / 3,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.backgroundElement,
  },
  headerText: { flex: 1, gap: Spacing.three, justifyContent: 'center' },
  title: { fontFamily: Type.dot, fontSize: 28, lineHeight: 32, color: C.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipActive: { borderColor: C.text },
  chipFavorite: { borderColor: C.accent },
  chipText: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  chipTextActive: { color: C.text },
  section: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  label: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  link: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  notes: {
    minHeight: 120,
    fontFamily: Type.mono,
    fontSize: 13,
    lineHeight: 20,
    color: C.text,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  insightInput: {
    flex: 1,
    minHeight: 44,
    fontFamily: Type.mono,
    fontSize: 13,
    color: C.text,
  },
  insight: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  insightBody: { flex: 1, gap: 2 },
  insightText: { fontFamily: Type.mono, fontSize: 13, lineHeight: 19, color: C.text },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent, marginTop: 7 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingLabel: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  overallRow: {
    marginTop: Spacing.two,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  overallLabel: { fontFamily: Type.dot, fontSize: 22, color: C.text, letterSpacing: 1 },
  remove: { alignSelf: 'center', padding: Spacing.three },
});
