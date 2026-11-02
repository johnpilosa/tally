import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Appear } from '@/animations/appear';
import { LangSwitch } from '@/components/lang-switch';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useFocusKey } from '@/hooks/use-focus-key';
import { useNow } from '@/hooks/use-now';
import { useGames, type Game } from '@/lib/games';
import { streakOf, useHunt } from '@/lib/hunt';
import { useI18n } from '@/lib/i18n';
import { useRA } from '@/lib/retro-achievements';
import { todayStart } from '@/lib/time';

const C = Colors.dark;
const DAY = 24 * 60 * 60 * 1000;
/** Cuántos días se ven en la fila de cuadritos. */
const DAYS = 14;

/**
 * Inicio de la caza: cuántos logros sacaste hoy, tu racha, la caza que tienes a medias, y tus
 * juegos enlazados con RetroAchievements para elegir cuál cazar. Pensada para el pulgar: todo
 * se toca con tarjetas grandes.
 */
export default function HuntHome() {
  const { t } = useI18n();
  const { games } = useGames();
  const { account, loaded } = useRA();
  const hunt = useHunt();
  const now = useNow();
  const focusKey = useFocusKey();
  const { width } = useWindowDimensions();

  const start = todayStart(now);
  const today = hunt.log.filter((u) => u.at >= start).length;
  const streak = streakOf(hunt.log, start);
  // Cuántos por día, de hace DAYS-1 días hasta hoy.
  const perDay = Array.from({ length: DAYS }, (_, i) => {
    const from = start - (DAYS - 1 - i) * DAY;
    return hunt.log.filter((u) => u.at >= from && u.at < from + DAY).length;
  });

  const linked = games.filter((g) => g.raGameId);
  const current = linked.find((g) => g.id === hunt.gameId);
  const cardWidth = Math.min(width * 0.4, 180);

  const pick = (game: Game) => {
    const same = game.id === hunt.gameId && hunt.targets.length > 0;
    hunt.startHunt(game.id);
    router.push(same ? '/hunt/play' : '/hunt/deck');
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader app="hunt" right={<LangSwitch />} />
      <ScrollView key={focusKey} contentContainerStyle={styles.content}>
        <Appear style={styles.today}>
          <View style={styles.todayRow}>
            <Text style={styles.todayNumber}>{today}</Text>
            <View style={styles.todayText}>
              <Text style={styles.todayLabel}>{t.hunt.unlockedToday}</Text>
              <Text style={[styles.label, streak > 0 && { color: C.accent }]}>
                {streak > 0 ? t.hunt.streak(streak) : t.hunt.noStreak}
              </Text>
            </View>
          </View>
          {/* Los últimos días: cada cuadrito se enciende más cuantos más logros sacaste. */}
          <View style={styles.days}>
            {perDay.map((n, i) => (
              <View
                key={i}
                style={[
                  styles.day,
                  n > 0 && { backgroundColor: C.accent, opacity: Math.min(1, 0.35 + n * 0.22) },
                  i === DAYS - 1 && styles.dayToday,
                ]}
              />
            ))}
          </View>
        </Appear>

        {current && hunt.targets.length > 0 && (
          <Appear options={{ index: 1 }}>
            <Pressable
              onPress={() => router.push('/hunt/play')}
              style={({ pressed }) => [styles.continue, pressed && { opacity: 0.8 }]}>
              {current.coverUrl ? (
                <Image source={{ uri: current.coverUrl }} style={styles.continueCover} />
              ) : (
                <View style={styles.continueCover} />
              )}
              <View style={styles.continueText}>
                <Text style={styles.continueTitle} numberOfLines={2}>
                  {current.title.toUpperCase()}
                </Text>
                <Text style={styles.label}>{t.hunt.targets(hunt.targets.length)}</Text>
                <Text style={styles.continueCta}>{t.hunt.continueHunt}</Text>
              </View>
            </Pressable>
          </Appear>
        )}

        <Appear options={{ index: 2 }}>
          <Text style={[styles.label, styles.pickLabel]}>{t.hunt.pickGame}</Text>
        </Appear>
        {loaded && !account ? (
          <Pressable onPress={() => router.push('/games/retro')} style={styles.cta}>
            <Text style={styles.ctaText}>{t.hunt.connect}</Text>
          </Pressable>
        ) : linked.length === 0 ? (
          <Text style={[styles.label, styles.pad]}>{t.hunt.noGames}</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + Spacing.three}
            decelerationRate="fast"
            contentContainerStyle={styles.carousel}>
            {linked.map((g, i) => (
              <Appear key={g.id} options={{ index: Math.min(i + 3, 8) }}>
                <Pressable
                  onPress={() => pick(g)}
                  style={({ pressed }) => [
                    { width: cardWidth },
                    styles.gameCard,
                    g.id === hunt.gameId && styles.gameCardActive,
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}>
                  {g.coverUrl ? (
                    <Image source={{ uri: g.coverUrl }} style={styles.cover} contentFit="cover" />
                  ) : (
                    <View style={styles.cover} />
                  )}
                  <Text style={styles.gameTitle} numberOfLines={2}>
                    {g.title.toUpperCase()}
                  </Text>
                </Pressable>
              </Appear>
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingBottom: Spacing.six, gap: Spacing.four },
  pad: { paddingHorizontal: Layout.gutter },
  label: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  today: {
    marginHorizontal: Layout.gutter,
    marginTop: Spacing.three,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Layout.radius,
    backgroundColor: '#111111',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  todayNumber: { fontFamily: Type.dot, fontSize: 72, lineHeight: 76, color: C.text },
  todayText: { flex: 1, gap: Spacing.one },
  todayLabel: { fontFamily: Type.mono, fontSize: 13, color: C.text, letterSpacing: 2 },
  // Los 14 días ocupan todo el ancho de la tarjeta.
  days: { flexDirection: 'row', gap: 4 },
  day: { flex: 1, aspectRatio: 1, borderRadius: 3, backgroundColor: C.border },
  dayToday: { borderWidth: 1, borderColor: C.text },
  continue: {
    marginHorizontal: Layout.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: Layout.radius,
    padding: Spacing.three,
    minHeight: 112,
  },
  continueCover: {
    width: 56,
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: C.backgroundElement,
  },
  continueText: { flex: 1, gap: Spacing.one },
  continueTitle: { fontFamily: Type.dot, fontSize: 20, lineHeight: 24, color: C.text },
  continueCta: { fontFamily: Type.monoBold, fontSize: 13, color: C.accent, letterSpacing: 1 },
  pickLabel: { paddingHorizontal: Layout.gutter },
  cta: { paddingHorizontal: Layout.gutter, paddingVertical: Spacing.three },
  ctaText: { fontFamily: Type.mono, fontSize: 13, color: C.text, letterSpacing: 1 },
  carousel: { paddingHorizontal: Layout.gutter, gap: Spacing.three },
  gameCard: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Layout.radius,
    padding: Spacing.two,
    gap: Spacing.two,
    backgroundColor: C.backgroundElement,
  },
  gameCardActive: { borderColor: C.text },
  cover: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 14,
    backgroundColor: C.background,
  },
  gameTitle: {
    fontFamily: Type.mono,
    fontSize: 12,
    lineHeight: 17,
    color: C.text,
    letterSpacing: 1,
    paddingHorizontal: Spacing.one,
    paddingBottom: Spacing.one,
    minHeight: 34,
  },
});
