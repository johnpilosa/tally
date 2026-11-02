import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hunt } from '@/animations/config';
import { HuntCard } from '@/components/hunt-card';
import { ScreenHeader } from '@/components/screen-header';
import { SwipeCard } from '@/components/swipe-card';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useGameProgress } from '@/hooks/use-game-progress';
import { useNow } from '@/hooks/use-now';
import { useGames } from '@/lib/games';
import { useHunt, type HuntUnlock } from '@/lib/hunt';
import { useI18n } from '@/lib/i18n';
import type { RAAchievement, RAProgress } from '@/lib/retro-achievements';
import { formatAgo, todayStart } from '@/lib/time';

const C = Colors.dark;
/** Alto del botón de revisar: grande, para el pulgar. */
const CHECK = 72;

/**
 * La caza: tu objetivo actual en grande y, abajo donde llega el pulgar, el botón para revisar
 * (hay que mantenerlo apretado). Si RetroAchievements dice que ya lo sacaste: sello, esquirlas y
 * vibración, y pasa el siguiente. Si no, la tarjeta tiembla. Deslizar la tarjeta pasa al
 * siguiente objetivo. Al volver a la app desde el juego, revisa solo.
 */
export default function HuntPlay() {
  const { t, lang } = useI18n();
  const hunt = useHunt();
  const { games } = useGames();
  const game = games.find((g) => g.id === hunt.gameId);
  const { progress, failed, refresh } = useGameProgress(game?.raGameId);
  const insets = useSafeAreaInsets();
  const { width: screen, height: screenHeight } = useWindowDimensions();
  const now = useNow();
  const [flipped, setFlipped] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ at: number; ok: boolean } | null>(null);
  const [celebrating, setCelebrating] = useState<RAAchievement | null>(null);
  const shake = useSharedValue(0);

  const width = Math.min(screen - Layout.gutter * 2, 420);
  const height = Math.max(
    340,
    Math.min(width * 1.35, screenHeight - insets.top - insets.bottom - Layout.headerHeight - 260),
  );

  const byId = new Map((progress?.achievements ?? []).map((a) => [a.id, a]));
  const queue = hunt.targets.map((id) => byId.get(id)).filter((a): a is RAAchievement => !!a);
  const current = celebrating ?? queue.find((a) => !a.earned) ?? null;
  const today = hunt.log.filter((u) => u.at >= todayStart(now)).length;

  /** Lo que RetroAchievements dice que ya tienes y la caza todavía no anotó. */
  const unlocksIn = (p: RAProgress): HuntUnlock[] =>
    p.achievements
      .filter((a) => a.earned && (hunt.targets.includes(a.id) || (a.earnedAt ?? 0) >= todayStart()))
      .map((a) => ({
        achievementId: a.id,
        gameId: hunt.gameId!,
        title: a.title,
        badge: a.badge,
        points: a.points,
        at: a.earnedAt ?? Date.now(),
      }));

  /** Revisa con RetroAchievements. `quiet`: sin "todavía no" (para el revisado automático). */
  const check = async (quiet = false) => {
    if (checking || celebrating || !current) return;
    setChecking(true);
    const target = current;
    const p = await refresh();
    setChecking(false);
    if (!p) return;
    const fresh = p.achievements.find((a) => a.id === target.id);
    if (fresh?.earned) {
      // Primero el festejo con la tarjeta todavía en pantalla; después se anota y pasa la siguiente.
      setCelebrating(fresh);
      setResult(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        hunt.logUnlocks(unlocksIn(p));
        setCelebrating(null);
        setFlipped(false);
      }, Hunt.celebrate);
    } else {
      hunt.logUnlocks(unlocksIn(p));
      if (quiet) return;
      setResult({ at: Date.now(), ok: false });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const { distance, times, stepDuration } = Hunt.shake;
      shake.set(
        withSequence(
          ...Array.from({ length: times }, () => [
            withTiming(distance, { duration: stepDuration }),
            withTiming(-distance, { duration: stepDuration }),
          ]).flat(),
          withTiming(0, { duration: stepDuration }),
        ),
      );
    }
  };

  // Al volver a la app (por ejemplo, después de jugar), revisa solo.
  const checkRef = useRef(check);
  useEffect(() => {
    checkRef.current = check;
  });
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkRef.current(true);
    });
    return () => sub.remove();
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));
  const index = current ? queue.indexOf(current) : -1;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        back="/hunt"
        title={game?.title.toUpperCase()}
        right={
          <View style={styles.todayChip}>
            <View style={styles.dot} />
            <Text style={styles.todayText}>{today}</Text>
          </View>
        }
      />

      <View style={styles.stage}>
        {!progress ? (
          <Text style={styles.label}>{failed ? t.games.raOffline : t.hunt.loading}</Text>
        ) : !current ? (
          <View style={styles.done}>
            <Text style={styles.doneTitle}>{t.hunt.huntDone}</Text>
            <Text style={styles.label}>{t.hunt.huntDoneHint}</Text>
            <Pressable onPress={() => router.replace('/hunt/deck')} style={styles.secondary}>
              <Text style={styles.secondaryText}>{t.hunt.pickMore}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.label}>{t.hunt.target(index + 1, queue.length)}</Text>
            <Animated.View style={shakeStyle}>
              <SwipeCard
                key={current.id}
                width={width}
                // Deslizar a cualquier lado: este para después, pasa el siguiente.
                onSwipe={() => {
                  hunt.later(current.id);
                  setFlipped(false);
                  setResult(null);
                }}
                onTap={() => setFlipped(!flipped)}>
                <HuntCard
                  achievement={current}
                  players={progress.players}
                  guideUrl={progress.guideUrl}
                  flipped={flipped}
                  width={width}
                  height={height}
                />
              </SwipeCard>
              {celebrating && <Celebration width={width} height={height} label={t.hunt.unlocked} />}
            </Animated.View>
            <Text style={[styles.label, result && !result.ok && { color: C.text }]}>
              {checking
                ? t.hunt.checking
                : result
                  ? `${t.hunt.notYet} · ${t.hunt.checkedAt(formatAgo(result.at, now, lang).toUpperCase())}`
                  : queue.length > 1
                    ? t.hunt.later
                    : ' '}
            </Text>
          </>
        )}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.three }]}>
        {current && (
          <HoldToCheck label={t.hunt.holdToCheck} onComplete={() => check()} busy={checking} />
        )}
        <Pressable hitSlop={12} onPress={() => router.push('/hunt/deck')}>
          <Text style={styles.edit}>{t.hunt.editHunt}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * El botón para revisar: hay que mantenerlo apretado mientras se llena (así no se revisa por
 * accidente). Al llenarse vibra y llama a `onComplete`; si sueltas antes, se vacía.
 */
function HoldToCheck({
  label,
  onComplete,
  busy,
}: {
  label: string;
  onComplete: () => void;
  busy: boolean;
}) {
  const fill = useSharedValue(0);
  // Se llena de izquierda a derecha mientras mantienes apretado.
  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: fill.get() }] }));
  const done = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onComplete();
  };

  return (
    <View style={styles.checkWrap}>
      <Pressable
        disabled={busy}
        onPressIn={() => {
          Haptics.selectionAsync();
          fill.set(
            withTiming(1, { duration: Hunt.holdToCheck, easing: Easing.linear }, (finished) => {
              if (finished) {
                runOnJS(done)();
                fill.set(withTiming(0, { duration: 250 }));
              }
            }),
          );
        }}
        onPressOut={() => {
          if (fill.get() < 1) fill.set(withTiming(0, { duration: 150 }));
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.check, busy && { opacity: 0.5 }]}>
        <Animated.View style={[styles.checkFill, fillStyle]} />
        <Text style={styles.checkLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}

/** El festejo sobre la tarjeta: un sello que se estampa y esquirlas que salen del centro. */
function Celebration({ width, height, label }: { width: number; height: number; label: string }) {
  const stamp = useSharedValue(0);
  const burst = useSharedValue(0);
  useEffect(() => {
    stamp.set(withTiming(1, { duration: Hunt.stamp, easing: Easing.out(Easing.back(2)) }));
    burst.set(withTiming(1, { duration: Hunt.celebrate * 0.6, easing: Easing.out(Easing.cubic) }));
  }, [stamp, burst]);

  const stampStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, stamp.get() * 2),
    transform: [{ scale: 2 - stamp.get() }, { rotate: '-10deg' }],
  }));

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.celebration, { width, height }]}>
      {Array.from({ length: Hunt.particles }, (_, i) => (
        <Particle key={i} index={i} progress={burst} />
      ))}
      <Animated.View style={[styles.stamp, stampStyle]}>
        <Text style={styles.stampText}>{label}</Text>
      </Animated.View>
    </View>
  );
}

function Particle({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const angle = (index / Hunt.particles) * Math.PI * 2 + (index % 3) * 0.3;
  const distance = Hunt.particleDistance * (0.6 + ((index * 37) % 10) / 25);
  const size = 6 + (index % 3) * 3;
  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: p === 0 ? 0 : 1 - p,
      transform: [
        { translateX: Math.cos(angle) * distance * p },
        { translateY: Math.sin(angle) * distance * p },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.particle,
        { width: size, height: size, backgroundColor: index % 4 === 0 ? C.text : C.accent },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  label: {
    fontFamily: Type.mono,
    fontSize: 11,
    color: C.textSecondary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  todayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  todayText: { fontFamily: Type.dot, fontSize: 16, color: C.text },
  done: { alignItems: 'center', gap: Spacing.three, paddingHorizontal: Layout.gutter },
  doneTitle: {
    fontFamily: Type.dot,
    fontSize: 40,
    lineHeight: 44,
    color: C.text,
    textAlign: 'center',
  },
  secondary: {
    marginTop: Spacing.two,
    borderWidth: 1,
    borderColor: C.text,
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  secondaryText: { fontFamily: Type.mono, fontSize: 13, color: C.text, letterSpacing: 1 },
  bottom: { alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.two },
  checkWrap: { alignSelf: 'stretch', paddingHorizontal: Layout.gutter },
  check: {
    height: CHECK,
    borderRadius: CHECK / 2,
    borderWidth: 1,
    borderColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: C.accent,
    transformOrigin: 'left',
  },
  checkLabel: { fontFamily: Type.monoBold, fontSize: 14, color: C.text, letterSpacing: 2 },
  edit: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  celebration: { alignItems: 'center', justifyContent: 'center' },
  stamp: {
    borderWidth: 3,
    borderColor: C.accent,
    borderRadius: 14,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: C.background,
  },
  stampText: { fontFamily: Type.dot, fontSize: 40, color: C.accent, letterSpacing: 2 },
  particle: { position: 'absolute', borderRadius: 2 },
});
