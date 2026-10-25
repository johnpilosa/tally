import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Overlay } from '@/animations/config';
import { BlurOverlay } from '@/components/blur-overlay';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { useGames, type GameStatus } from '@/lib/games';
import { useI18n } from '@/lib/i18n';
import { fetchGame, yearOf, type GameInfo } from '@/lib/wiki-games';

const C = Colors.dark;
const SIDE = Spacing.four;

/** Ficha de un juego: título enorme, resumen, portada, y botones para agregarlo. */
export default function GameScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { t } = useI18n();
  const { games, addGame, updateGame } = useGames();
  const saved = games.find((g) => g.id === key);

  const [info, setInfo] = useState<GameInfo | null>(null);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState<GameStatus>(saved?.status ?? 'playing');
  const [statusOpen, setStatusOpen] = useState(false);
  const [addedOpen, setAddedOpen] = useState(false);

  useEffect(() => {
    if (saved || !key) return;
    const controller = new AbortController();
    fetchGame(key, controller.signal)
      .then(setInfo)
      .catch((e) => {
        if (e.name !== 'AbortError') setFailed(true);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const game = saved ?? info;

  const pickStatus = (next: GameStatus) => {
    setStatus(next);
    setStatusOpen(false);
    if (saved) updateGame(saved.id, { status: next });
  };

  const add = () => {
    if (!info || saved) return;
    addGame(info, status);
    setAddedOpen(true);
  };

  const openReview = () => {
    setAddedOpen(false);
    router.push({ pathname: '/games/review', params: { id: key } });
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: '' }} />
      {!game ? (
        <View style={styles.center}>
          <Text style={styles.label}>{failed ? t.games.offline : t.games.loading}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeIn.duration(250)}>
            <BigTitle title={game.title} />
            {yearOf(game.description) && (
              <Text style={styles.label}>{yearOf(game.description)}</Text>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(300)} style={styles.boxes}>
            <View style={[styles.box, styles.summaryBox]}>
              <Text style={styles.label}>{t.games.about}</Text>
              <Text style={styles.summary} numberOfLines={14}>
                {game.summary || t.games.noSummary}
              </Text>
            </View>
            <Cover url={game.coverUrl} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(300)} style={styles.actions}>
            <Pressable
              onPress={add}
              disabled={!!saved || !info}
              style={({ pressed }) => [
                styles.button,
                !saved && styles.buttonPrimary,
                pressed && { opacity: 0.7 },
              ]}>
              <Text style={[styles.buttonText, !saved && styles.buttonTextPrimary]}>
                {saved ? t.games.inList : t.games.addButton}
              </Text>
            </Pressable>

            <View style={styles.statusWrap}>
              <Pressable
                onPress={() => setStatusOpen((o) => !o)}
                style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}>
                <Text style={styles.buttonText}>
                  {t.games[status]} {statusOpen ? '▴' : '▾'}
                </Text>
              </Pressable>
              {statusOpen && (
                <Animated.View entering={FadeInDown.duration(150)} style={styles.statusMenu}>
                  {(['playing', 'played'] as const).map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => pickStatus(s)}
                      style={({ pressed }) => [styles.statusItem, pressed && { opacity: 0.6 }]}>
                      {s === status && <View style={styles.dot} />}
                      <Text style={[styles.buttonText, s !== status && styles.dim]}>
                        {t.games[s]}
                      </Text>
                    </Pressable>
                  ))}
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {saved && (
            <Pressable onPress={openReview} style={styles.reviewLink}>
              <Text style={styles.buttonText}>{t.games.openReview}</Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      <BlurOverlay visible={addedOpen} onClose={() => setAddedOpen(false)}>
        <View style={styles.popupWrap} pointerEvents="box-none">
          <Animated.View
            entering={ZoomIn.springify()
              .damping(Overlay.enter.damping)
              .stiffness(Overlay.enter.stiffness)}
            style={styles.popup}>
            <View style={styles.popupTitleRow}>
              <View style={styles.dot} />
              <Text style={styles.label}>{t.games.addedTitle}</Text>
            </View>
            <Text style={styles.popupGame} numberOfLines={3}>
              {game?.title.toUpperCase()}
            </Text>
            <Pressable
              onPress={openReview}
              style={({ pressed }) => [
                styles.button,
                styles.buttonPrimary,
                pressed && { opacity: 0.7 },
              ]}>
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                {t.games.writeReview}
              </Text>
            </Pressable>
            <Pressable onPress={() => setAddedOpen(false)} style={styles.popupSecondary}>
              <Text style={[styles.buttonText, styles.dim]}>{t.games.keepBrowsing}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </BlurOverlay>
    </View>
  );
}

/**
 * El título lo más grande posible de lado a lado: el tamaño de letra se calcula para que la
 * palabra más larga quepa justo en el ancho de la pantalla.
 */
function BigTitle({ title }: { title: string }) {
  const { width } = useWindowDimensions();
  const available = Math.min(width, MaxContentWidth) - SIDE * 2;
  const longestWord = Math.max(...title.split(/\s+/).map((w) => w.length), 4);
  // Cada letra de Doto mide un poco más de 0.6 veces el tamaño de letra.
  const fontSize = Math.max(28, Math.min(110, available / (longestWord * 0.66)));
  return (
    <Text style={[styles.bigTitle, { fontSize, lineHeight: fontSize * 1.05 }]}>
      {title.toUpperCase()}
    </Text>
  );
}

function Cover({ url }: { url: string | null }) {
  if (!url) {
    return (
      <View style={[styles.cover, styles.noCover]}>
        <View style={styles.dot} />
      </View>
    );
  }
  return <Image source={{ uri: url }} style={styles.cover} contentFit="cover" transition={250} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: SIDE,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  bigTitle: { fontFamily: Type.dot, color: C.text },
  label: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  boxes: { flexDirection: 'row', gap: Spacing.three, alignItems: 'stretch' },
  box: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  summaryBox: { flex: 1, gap: Spacing.two },
  summary: { fontFamily: Type.mono, fontSize: 12, lineHeight: 18, color: C.text },
  cover: {
    width: '42%',
    aspectRatio: 2 / 3,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.backgroundElement,
  },
  noCover: { alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: Spacing.three, zIndex: 10 },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.text,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  buttonPrimary: { backgroundColor: C.text },
  buttonText: { fontFamily: Type.mono, fontSize: 13, color: C.text, letterSpacing: 2 },
  buttonTextPrimary: { color: C.background },
  dim: { color: C.textSecondary },
  statusWrap: { flex: 1 },
  statusMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: Spacing.two,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Spacing.three,
    backgroundColor: C.background,
    overflow: 'hidden',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  reviewLink: { alignSelf: 'center', padding: Spacing.three },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  popupWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  popup: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Spacing.four,
    backgroundColor: C.background,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  popupTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  popupGame: { fontFamily: Type.dot, fontSize: 28, lineHeight: 32, color: C.text },
  popupSecondary: { alignItems: 'center', padding: Spacing.two },
});
