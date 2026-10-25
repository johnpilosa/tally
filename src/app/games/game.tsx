import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { floatIn } from '@/animations/presets';
import { BlurOverlay } from '@/components/blur-overlay';
import { GamesMenuButton } from '@/components/games-nav';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { useGames, type GameStatus } from '@/lib/games';
import { useI18n } from '@/lib/i18n';
import {
  fetchGame,
  fetchScreenshots,
  yearOf,
  type GameInfo,
  type Screenshot,
} from '@/lib/wiki-games';

const C = Colors.dark;
const SIDE = Spacing.four;
const RADIUS = 20;

/** Ficha de un juego: título, resumen y portada lado a lado, capturas, y botones para agregarlo. */
export default function GameScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { t } = useI18n();
  const { games, addGame, updateGame } = useGames();
  const { width } = useWindowDimensions();
  const saved = games.find((g) => g.id === key);

  const [info, setInfo] = useState<GameInfo | null>(null);
  const [shots, setShots] = useState<Screenshot[]>([]);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState<GameStatus>(saved?.status ?? 'playing');
  const [statusOpen, setStatusOpen] = useState(false);
  const [addedOpen, setAddedOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [shotOpen, setShotOpen] = useState<Screenshot | null>(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    if (!saved) {
      fetchGame(key, controller.signal)
        .then(setInfo)
        .catch((e) => {
          if (e.name !== 'AbortError') setFailed(true);
        });
    }
    fetchScreenshots(key, controller.signal)
      .then(setShots)
      .catch(() => {});
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const game = saved ?? info;
  const content = Math.min(width, MaxContentWidth) - SIDE * 2;
  const coverWidth = content * 0.42;
  const boxHeight = coverWidth * 1.5;

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

  const year = game ? yearOf(game.description) : null;
  // Si ya está guardado, manda su estado guardado (puede cargar después de abrir la pantalla).
  const shownStatus = saved?.status ?? status;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: '', headerRight: () => <GamesMenuButton /> }} />
      {!game ? (
        <View style={styles.center}>
          <Text style={styles.label}>{failed ? t.games.offline : t.games.loading}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={floatIn()} style={styles.titleBlock}>
            <Title title={game.title} width={content} />
            <View style={styles.metaRow}>
              {year && <Text style={styles.metaChip}>{year}</Text>}
              {saved && <Text style={[styles.metaChip, styles.metaChipOn]}>{t.games.inList}</Text>}
            </View>
          </Animated.View>

          <Animated.View
            entering={floatIn({ index: 2 })}
            style={[styles.boxes, { height: boxHeight }]}>
            <Pressable onPress={() => setSummaryOpen(true)} style={styles.summaryBox}>
              <Text style={styles.label}>{t.games.about}</Text>
              <Text style={styles.summary}>{game.summary || t.games.noSummary}</Text>
              {/* Se desvanece abajo en vez de cortarse de golpe. */}
              <Svg style={styles.fade} pointerEvents="none">
                <Defs>
                  <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={C.backgroundElement} stopOpacity="0" />
                    <Stop offset="0.75" stopColor={C.backgroundElement} stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#fade)" />
              </Svg>
              <Text style={styles.readMore}>{t.games.readMore}</Text>
            </Pressable>
            <Cover url={game.coverUrl} width={coverWidth} />
          </Animated.View>

          <Animated.View entering={floatIn({ index: 4 })} style={styles.actionsBlock}>
            <View style={styles.actions}>
              <Pressable
                onPress={add}
                disabled={!!saved || !info}
                style={({ pressed }) => [
                  styles.button,
                  styles.grow,
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
                    {t.games[shownStatus]} {statusOpen ? '▴' : '▾'}
                  </Text>
                </Pressable>
                {statusOpen && (
                  <View style={styles.statusMenu}>
                    {(['playing', 'played'] as const).map((s, i) => (
                      <Animated.View key={s} entering={floatIn({ direction: -1, index: i })}>
                        <Pressable
                          onPress={() => pickStatus(s)}
                          style={({ pressed }) => [styles.statusItem, pressed && { opacity: 0.6 }]}>
                          {s === shownStatus && <View style={styles.dot} />}
                          <Text style={[styles.buttonText, s !== shownStatus && styles.dim]}>
                            {t.games[s]}
                          </Text>
                        </Pressable>
                      </Animated.View>
                    ))}
                  </View>
                )}
              </View>
            </View>
            {saved && (
              <Pressable onPress={openReview} style={styles.reviewLink}>
                <Text style={styles.buttonText}>{t.games.openReview}</Text>
              </Pressable>
            )}
          </Animated.View>

          {shots.length > 0 && (
            <Animated.View entering={floatIn({ index: 6 })} style={styles.shotsBlock}>
              <Text style={styles.label}>{t.games.screenshots}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shots}
                style={styles.shotsScroll}>
                {shots.map((shot) => (
                  <Pressable key={shot.url} onPress={() => setShotOpen(shot)}>
                    <Image
                      source={{ uri: shot.url }}
                      style={[styles.shot, { width: content * 0.78 }]}
                      contentFit="cover"
                      transition={300}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          )}
        </ScrollView>
      )}

      {/* Popup: agregado a la lista */}
      <BlurOverlay visible={addedOpen} onClose={() => setAddedOpen(false)}>
        <View style={styles.popupWrap} pointerEvents="box-none">
          <Animated.View entering={floatIn()} style={styles.popup}>
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

      {/* Resumen completo */}
      <BlurOverlay visible={summaryOpen} onClose={() => setSummaryOpen(false)}>
        <View style={styles.popupWrap} pointerEvents="box-none">
          <Animated.View entering={floatIn()} style={[styles.popup, styles.summaryPopup]}>
            <Text style={styles.label}>{t.games.about}</Text>
            <ScrollView>
              <Text style={styles.summaryFull}>{game?.summary}</Text>
            </ScrollView>
            <Pressable onPress={() => setSummaryOpen(false)} style={styles.popupSecondary}>
              <Text style={[styles.buttonText, styles.dim]}>{t.games.close}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </BlurOverlay>

      {/* Captura en grande */}
      <BlurOverlay visible={!!shotOpen} onClose={() => setShotOpen(null)}>
        <View style={styles.popupWrap} pointerEvents="box-none">
          {shotOpen && (
            <Animated.View entering={floatIn()} style={styles.shotFull} pointerEvents="none">
              <Image
                source={{ uri: shotOpen.url }}
                style={styles.shotFullImage}
                contentFit="contain"
              />
              {!!shotOpen.caption && <Text style={styles.caption}>{shotOpen.caption}</Text>}
            </Animated.View>
          )}
        </View>
      </BlurOverlay>
    </View>
  );
}

/** El título grande: ocupa el ancho, pero con un tope para que no se coma la pantalla. */
function Title({ title, width }: { title: string; width: number }) {
  const longestWord = Math.max(...title.split(/\s+/).map((w) => w.length), 6);
  // Cada letra de Doto mide un poco más de 0.6 veces el tamaño de letra.
  const fontSize = Math.max(24, Math.min(44, width / (longestWord * 0.66)));
  return (
    <Text style={[styles.title, { fontSize, lineHeight: fontSize * 1.12 }]}>
      {title.toUpperCase()}
    </Text>
  );
}

function Cover({ url, width }: { url: string | null; width: number }) {
  const style = [styles.cover, { width }];
  if (!url) {
    return (
      <View style={[style, styles.noCover]}>
        <View style={styles.dot} />
      </View>
    );
  }
  return <Image source={{ uri: url }} style={style} contentFit="cover" transition={300} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: SIDE,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  titleBlock: { gap: Spacing.three },
  title: { fontFamily: Type.dot, color: C.text },
  metaRow: { flexDirection: 'row', gap: Spacing.two },
  metaChip: {
    fontFamily: Type.mono,
    fontSize: 10,
    color: C.textSecondary,
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    overflow: 'hidden',
  },
  metaChipOn: { color: C.text, borderColor: C.textSecondary },
  label: { fontFamily: Type.mono, fontSize: 10, color: C.textSecondary, letterSpacing: 2 },
  boxes: { flexDirection: 'row', gap: Spacing.three },
  summaryBox: {
    flex: 1,
    backgroundColor: C.backgroundElement,
    borderRadius: RADIUS,
    padding: Spacing.three,
    paddingTop: Spacing.three + 2,
    gap: Spacing.two,
    overflow: 'hidden',
  },
  summary: { fontFamily: Type.mono, fontSize: 11.5, lineHeight: 18, color: C.text },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
  readMore: {
    position: 'absolute',
    left: Spacing.three,
    bottom: Spacing.three,
    fontFamily: Type.mono,
    fontSize: 10,
    color: C.text,
    letterSpacing: 2,
  },
  cover: {
    height: '100%',
    borderRadius: RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    backgroundColor: C.backgroundElement,
  },
  noCover: { alignItems: 'center', justifyContent: 'center' },
  actionsBlock: { gap: Spacing.three, zIndex: 10 },
  actions: { flexDirection: 'row', gap: Spacing.three, zIndex: 10 },
  button: {
    borderWidth: 1,
    borderColor: C.text,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  buttonPrimary: { backgroundColor: C.text },
  buttonText: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 2 },
  buttonTextPrimary: { color: C.background },
  dim: { color: C.textSecondary },
  grow: { flex: 1 },
  statusWrap: { flex: 1 },
  statusMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    backgroundColor: C.background,
  },
  reviewLink: { alignSelf: 'center', padding: Spacing.two },
  shotsBlock: { gap: Spacing.three },
  shotsScroll: { marginHorizontal: -SIDE },
  shots: { gap: Spacing.three, paddingHorizontal: SIDE },
  shot: {
    aspectRatio: 16 / 9,
    borderRadius: RADIUS,
    backgroundColor: C.backgroundElement,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  popupWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  popup: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 28,
    backgroundColor: C.background,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  summaryPopup: { maxWidth: 480, maxHeight: '75%' },
  summaryFull: { fontFamily: Type.mono, fontSize: 13, lineHeight: 21, color: C.text },
  popupTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  popupGame: { fontFamily: Type.dot, fontSize: 28, lineHeight: 32, color: C.text },
  popupSecondary: { alignItems: 'center', padding: Spacing.two },
  shotFull: { width: '100%', maxWidth: 900, gap: Spacing.three },
  shotFullImage: { width: '100%', aspectRatio: 16 / 10, borderRadius: RADIUS },
  caption: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, textAlign: 'center' },
});
