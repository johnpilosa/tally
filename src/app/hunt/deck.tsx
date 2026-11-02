import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HuntCard } from '@/components/hunt-card';
import { ScreenHeader } from '@/components/screen-header';
import { SwipeCard } from '@/components/swipe-card';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useGameProgress } from '@/hooks/use-game-progress';
import { useGames } from '@/lib/games';
import { useHunt } from '@/lib/hunt';
import { useI18n } from '@/lib/i18n';

const C = Colors.dark;
/** Cuántas tarjetas se ven apiladas detrás de la de arriba. */
const BEHIND = 2;

/**
 * El mazo: una tarjeta por cada logro que te falta, de los más fáciles a los más difíciles.
 * Derecha la agrega a tu caza, izquierda la salta, un toque la da vuelta. Los botones de abajo
 * hacen lo mismo, para no tener que deslizar.
 */
export default function HuntDeck() {
  const { t } = useI18n();
  const hunt = useHunt();
  const { games } = useGames();
  const game = games.find((g) => g.id === hunt.gameId);
  const { progress, failed } = useGameProgress(game?.raGameId);
  const insets = useSafeAreaInsets();
  const { width: screen, height: screenHeight } = useWindowDimensions();
  const [flippedId, setFlippedId] = useState<number | null>(null);
  const [fling, setFling] = useState<{ dir: 1 | -1; n: number }>({ dir: 1, n: 0 });

  const width = Math.min(screen - Layout.gutter * 2, 420);
  const height = Math.max(
    360,
    Math.min(width * 1.4, screenHeight - insets.top - insets.bottom - Layout.headerHeight - 250),
  );

  const deck = (progress?.achievements ?? [])
    .filter((a) => !a.earned && !hunt.targets.includes(a.id) && !hunt.skipped.includes(a.id))
    .sort((a, b) => b.numAwarded - a.numAwarded);
  const left = (progress?.achievements ?? []).filter((a) => !a.earned).length;

  const onSwipe = (id: number) => (dir: 1 | -1) => {
    if (dir === 1) {
      hunt.addTarget(id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      hunt.skip(id);
      Haptics.selectionAsync();
    }
    setFlippedId(null);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader back="/hunt" title={t.hunt.buildHunt} />

      <View style={styles.stage}>
        {!progress ? (
          <Text style={styles.label}>{failed ? t.games.raOffline : t.hunt.loading}</Text>
        ) : deck.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {left === 0 ? t.hunt.allUnlocked : t.hunt.deckEmpty}
            </Text>
            {hunt.skipped.length > 0 && (
              <Pressable onPress={hunt.resetSkipped} style={styles.secondary}>
                <Text style={styles.secondaryText}>{t.hunt.seeSkipped}</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={{ width, height }}>
            {/* De atrás para adelante: la de arriba se dibuja al final. */}
            {deck
              .slice(0, BEHIND + 1)
              .reverse()
              .map((a, i, shown) => {
                const depth = shown.length - 1 - i;
                return (
                  <Stacked key={a.id} depth={depth}>
                    {depth === 0 ? (
                      <SwipeCard
                        width={width}
                        onSwipe={onSwipe(a.id)}
                        onTap={() => setFlippedId(flippedId === a.id ? null : a.id)}
                        fling={fling}
                        rightLabel={t.hunt.hunt}
                        leftLabel={t.hunt.skip}>
                        <HuntCard
                          achievement={a}
                          players={progress.players}
                          guideUrl={progress.guideUrl}
                          flipped={flippedId === a.id}
                          width={width}
                          height={height}
                        />
                      </SwipeCard>
                    ) : (
                      // Las de atrás son solo el borde del montón: sin contenido que se mezcle.
                      <View style={[styles.behind, { width, height }]} />
                    )}
                  </Stacked>
                );
              })}
          </View>
        )}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.three }]}>
        {deck.length > 0 && (
          <>
            <Text style={styles.hint}>{t.hunt.swipeHint}</Text>
            <View style={styles.buttons}>
              <Pressable
                onPress={() => setFling({ dir: -1, n: fling.n + 1 })}
                accessibilityLabel={t.hunt.skip}
                style={({ pressed }) => [styles.choice, pressed && styles.pressed]}>
                <Text style={styles.choiceText}>✕ {t.hunt.skip}</Text>
              </Pressable>
              <Pressable
                onPress={() => setFling({ dir: 1, n: fling.n + 1 })}
                accessibilityLabel={t.hunt.hunt}
                style={({ pressed }) => [
                  styles.choice,
                  styles.choiceHunt,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.choiceText, { color: C.text }]}>{t.hunt.hunt} ✓</Text>
              </Pressable>
            </View>
          </>
        )}
        <Pressable
          onPress={() => router.replace('/hunt/play')}
          disabled={hunt.targets.length === 0}
          style={({ pressed }) => [
            styles.start,
            hunt.targets.length === 0 && { opacity: 0.25 },
            pressed && { opacity: 0.8 },
          ]}>
          <Text style={styles.startText}>
            {hunt.targets.length
              ? `${t.hunt.startHunt}  ·  ${hunt.targets.length}`
              : t.hunt.startHunt}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Una tarjeta del montón: las de atrás, un poco más chicas y más abajo. */
function Stacked({ depth, children }: { depth: number; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: withTiming(depth * 14, { duration: 200 }) },
      { scale: withTiming(1 - depth * 0.05, { duration: 200 }) },
    ],
  }));
  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  behind: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 28,
    backgroundColor: C.backgroundElement,
  },
  label: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  empty: { alignItems: 'center', gap: Spacing.four, paddingHorizontal: Layout.gutter },
  emptyTitle: {
    fontFamily: Type.dot,
    fontSize: 28,
    lineHeight: 34,
    color: C.text,
    textAlign: 'center',
  },
  secondary: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  secondaryText: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  bottom: { paddingHorizontal: Layout.gutter, gap: Spacing.three, alignItems: 'center' },
  hint: {
    fontFamily: Type.mono,
    fontSize: 10,
    color: C.textSecondary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  // Dos botones anchos, del mismo tamaño, al alcance del pulgar.
  buttons: { flexDirection: 'row', gap: Spacing.three, alignSelf: 'stretch' },
  choice: {
    flex: 1,
    height: 60,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceHunt: { backgroundColor: C.accent, borderColor: C.accent },
  pressed: { transform: [{ scale: 0.96 }] },
  choiceText: { fontFamily: Type.monoBold, fontSize: 13, color: C.textSecondary, letterSpacing: 2 },
  start: {
    alignSelf: 'stretch',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.text,
    paddingVertical: Spacing.three + 2,
    alignItems: 'center',
  },
  startText: { fontFamily: Type.monoBold, fontSize: 13, color: C.text, letterSpacing: 2 },
});
