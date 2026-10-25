import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/animations/appear';
import { BlurOverlay } from '@/components/blur-overlay';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useGames, type Game } from '@/lib/games';
import { useI18n } from '@/lib/i18n';
import {
  cleanTitle,
  fetchPlayedGames,
  fetchProgress,
  raBadge,
  titleSimilarity,
  useRA,
  type RAAchievement,
  type RAPlayedGame,
  type RAProgress,
} from '@/lib/retro-achievements';

const C = Colors.dark;

/**
 * Los logros de RetroAchievements de un juego, en su reseña. Sin cuenta, invita a conectarla;
 * con cuenta pero sin enlazar, deja elegir cuál de tus juegos de RetroAchievements es.
 */
export function RAAchievements({ game }: { game: Game }) {
  const { t } = useI18n();
  const { account, loaded } = useRA();
  const [linking, setLinking] = useState(false);

  if (!loaded) return null;
  if (!account) {
    return (
      <Pressable onPress={() => router.push('/games/retro')}>
        <Text style={styles.link}>{t.games.raConnectCta}</Text>
      </Pressable>
    );
  }
  if (!game.raGameId) {
    return (
      <>
        <Pressable onPress={() => setLinking(true)}>
          <Text style={styles.link}>{t.games.raLink}</Text>
        </Pressable>
        <LinkPicker game={game} open={linking} onClose={() => setLinking(false)} />
      </>
    );
  }
  return <Progress key={game.raGameId} game={game} gameId={game.raGameId} />;
}

/** Cuántos llevas, la insignia de maestría si la tienes y todas las insignias de logros. */
function Progress({ game, gameId }: { game: Game; gameId: number }) {
  const { t } = useI18n();
  const { account } = useRA();
  const { updateGame } = useGames();
  const [progress, setProgress] = useState<RAProgress | null>(null);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState<RAAchievement | null>(null);

  useEffect(() => {
    if (!account) return;
    let active = true;
    fetchProgress(account, gameId)
      .then((p) => active && setProgress(p))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [account, gameId]);

  if (failed) return <Text style={styles.label}>{t.games.raOffline}</Text>;
  if (!progress) return <Text style={styles.label}>{t.games.loading}</Text>;

  const award = progress.award?.startsWith('beaten')
    ? t.games.raAwards.beaten
    : progress.award === 'mastered' || progress.award === 'completed'
      ? t.games.raAwards[progress.award]
      : null;

  return (
    <View style={styles.progress}>
      {progress.total === 0 ? (
        <Text style={styles.label}>{t.games.raNoAchievements}</Text>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <Text style={styles.count}>{t.games.raProgress(progress.earned, progress.total)}</Text>
            {award && (
              <View style={[styles.award, progress.award === 'mastered' && styles.mastered]}>
                <Text
                  style={[styles.awardText, progress.award === 'mastered' && { color: C.accent }]}>
                  {award}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.bar}>
            <View
              style={[styles.barFill, { width: `${(progress.earned / progress.total) * 100}%` }]}
            />
          </View>
          <View style={styles.badges}>
            {progress.achievements.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => setPicked(picked?.id === a.id ? null : a)}
                style={[styles.badgeWrap, picked?.id === a.id && styles.badgePicked]}>
                <Image
                  source={{ uri: raBadge(a.badge, a.earned) }}
                  style={[styles.badge, !a.earned && { opacity: 0.45 }]}
                />
              </Pressable>
            ))}
          </View>
          {/* Tocar una insignia muestra qué logro es. */}
          {picked && (
            <Appear key={picked.id} style={styles.picked}>
              <Text style={styles.pickedTitle}>
                {picked.title.toUpperCase()} · {picked.points}
              </Text>
              <Text style={styles.label}>{picked.description}</Text>
            </Appear>
          )}
        </>
      )}
      <Pressable
        hitSlop={8}
        onPress={() => updateGame(game.id, { raGameId: undefined })}
        style={styles.unlink}>
        <Text style={styles.label}>{t.games.raUnlink}</Text>
      </Pressable>
    </View>
  );
}

/** Tus juegos de RetroAchievements, los que más se parecen a este primero. */
function LinkPicker({ game, open, onClose }: { game: Game; open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { account } = useRA();
  const { updateGame } = useGames();
  const insets = useSafeAreaInsets();
  const [played, setPlayed] = useState<RAPlayedGame[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open || !account || played) return;
    let active = true;
    fetchPlayedGames(account)
      .then((list) => active && setPlayed(list))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [open, account, played]);

  const matches = (played ?? [])
    .map((g) => ({ g, score: titleSimilarity(g.title, game.title) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((m) => m.g);

  return (
    <BlurOverlay visible={open} onClose={onClose}>
      <View style={[styles.popupWrap, { paddingTop: insets.top }]} pointerEvents="box-none">
        <Appear style={styles.popup}>
          <Text style={styles.label}>{t.games.raLinkTitle}</Text>
          <Text style={styles.popupTitle} numberOfLines={2}>
            {game.title.toUpperCase()}
          </Text>
          {failed ? (
            <Text style={styles.label}>{t.games.raOffline}</Text>
          ) : !played ? (
            <Text style={styles.label}>{t.games.loading}</Text>
          ) : matches.length === 0 ? (
            <Text style={styles.label}>{t.games.raLinkNone}</Text>
          ) : (
            <ScrollView style={styles.options}>
              {matches.map((g) => (
                <Pressable
                  key={g.gameId}
                  onPress={() => {
                    updateGame(game.id, { raGameId: g.gameId });
                    onClose();
                  }}
                  style={({ pressed }) => [styles.option, pressed && { opacity: 0.6 }]}>
                  <Image source={{ uri: g.icon }} style={styles.optionIcon} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.optionTitle} numberOfLines={2}>
                      {cleanTitle(g.title).toUpperCase()}
                    </Text>
                    <Text style={styles.label}>{g.console.toUpperCase()}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.close, pressed && { opacity: 0.7 }]}>
            <Text style={styles.closeText}>{t.games.cancel}</Text>
          </Pressable>
        </Appear>
      </View>
    </BlurOverlay>
  );
}

const BADGE = 40;

const styles = StyleSheet.create({
  link: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  label: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  progress: { gap: Spacing.three },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  award: {
    borderWidth: 1,
    borderColor: C.text,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  mastered: { borderColor: C.accent },
  awardText: { fontFamily: Type.mono, fontSize: 10, color: C.text, letterSpacing: 1 },
  bar: { height: 3, borderRadius: 2, backgroundColor: C.border, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: C.accent },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  badgeWrap: { borderRadius: 8, borderWidth: 1, borderColor: 'transparent', padding: 1 },
  badgePicked: { borderColor: C.text },
  badge: { width: BADGE, height: BADGE, borderRadius: 6, backgroundColor: C.backgroundElement },
  picked: { gap: 2 },
  pickedTitle: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  unlink: { alignSelf: 'flex-start' },
  popupWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  popup: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Layout.popupRadius,
    backgroundColor: C.background,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  popupTitle: { fontFamily: Type.dot, fontSize: 26, lineHeight: 30, color: C.text },
  options: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  optionIcon: { width: 40, height: 40, borderRadius: 6, backgroundColor: C.backgroundElement },
  optionTitle: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  close: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  closeText: { fontFamily: Type.mono, fontSize: 13, color: C.text, letterSpacing: 2 },
});
