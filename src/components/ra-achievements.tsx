import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/animations/appear';
import { BlurOverlay } from '@/components/blur-overlay';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useGames, type Game } from '@/lib/games';
import { useNow } from '@/hooks/use-now';
import { useI18n } from '@/lib/i18n';
import { formatDate } from '@/lib/time';
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
  const { t, lang } = useI18n();
  const now = useNow();
  const { account } = useRA();
  const { updateGame } = useGames();
  const [progress, setProgress] = useState<RAProgress | null>(null);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState<RAAchievement | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);

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

  // El que se muestra en grande: el que tocaste, o si no, el primero (el último que sacaste).
  const selected = picked ?? progress.achievements[0] ?? null;

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
          {/* Los últimos que sacaste, con nombre y fecha; después, todas las insignias. */}
          {progress.earned > 0 && (
            <View style={styles.latest}>
              <Text style={styles.label}>{t.games.raLatest}</Text>
              {progress.achievements
                .filter((a) => a.earned)
                .slice(0, LATEST)
                .map((a) => (
                  <View key={a.id} style={styles.latestRow}>
                    <Image source={{ uri: raBadge(a.badge, true) }} style={styles.latestBadge} />
                    <View style={styles.latestText}>
                      <Text style={styles.pickedTitle} numberOfLines={1}>
                        {a.title.toUpperCase()}
                      </Text>
                      <Text style={styles.label} numberOfLines={2}>
                        {a.description}
                      </Text>
                    </View>
                    <View style={styles.latestMeta}>
                      <Text style={styles.label}>
                        {a.earnedAt ? formatDate(a.earnedAt, now, lang).toUpperCase() : ''}
                      </Text>
                      <Text style={styles.label}>{t.games.raPointsShort(a.points)}</Text>
                    </View>
                  </View>
                ))}
            </View>
          )}
          {/* El logro elegido en el bloque de abajo (al abrir, el último que sacaste). */}
          {selected && (
            <Appear key={selected.id}>
              <Pressable
                onPress={() => setStatsOpen(true)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.detail, pressed && { opacity: 0.7 }]}>
                <Image
                  source={{ uri: raBadge(selected.badge, selected.earned) }}
                  style={[styles.detailBadge, !selected.earned && { opacity: 0.45 }]}
                />
                <View style={styles.latestText}>
                  <Text style={styles.detailTitle} numberOfLines={1}>
                    {selected.title.toUpperCase()}
                  </Text>
                  <Text style={styles.detailDescription} numberOfLines={3}>
                    {selected.description}
                  </Text>
                  <Text style={styles.label}>
                    {t.games.raPointsShort(selected.points)}
                    {'  ·  '}
                    {selected.earnedAt
                      ? formatDate(selected.earnedAt, now, lang).toUpperCase()
                      : t.games.raLocked}
                  </Text>
                </View>
                {/* Tocar la tarjeta abre las estadísticas del logro. */}
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </Appear>
          )}
          <View style={styles.badges}>
            {progress.achievements.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => setPicked(a)}
                style={[styles.badgeWrap, selected?.id === a.id && styles.badgePicked]}>
                <Image
                  source={{ uri: raBadge(a.badge, a.earned) }}
                  style={[styles.badge, !a.earned && { opacity: 0.45 }]}
                />
              </Pressable>
            ))}
          </View>
        </>
      )}
      <Pressable
        hitSlop={8}
        onPress={() => updateGame(game.id, { raGameId: undefined })}
        style={styles.unlink}>
        <Text style={styles.label}>{t.games.raUnlink}</Text>
      </Pressable>
      {selected && (
        <AchievementStats
          achievement={selected}
          players={progress.players}
          open={statsOpen}
          onClose={() => setStatsOpen(false)}
        />
      )}
    </View>
  );
}

/** Mini ventana con los números de un logro: qué tan raro es, puntos, tipo, cuándo lo sacaste. */
function AchievementStats({
  achievement: a,
  players,
  open,
  onClose,
}: {
  achievement: RAAchievement;
  players: number;
  open: boolean;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const now = useNow();
  const insets = useSafeAreaInsets();
  const rate = players ? a.numAwarded / players : 0;
  const pct = (n: number) =>
    `${(n * 100).toLocaleString(lang, { maximumFractionDigits: n < 0.1 ? 2 : 1 })}%`;
  const date = (ms: number | null) => (ms ? formatDate(ms, now, lang).toUpperCase() : '');
  const type =
    a.type && a.type in t.games.raTypes
      ? t.games.raTypes[a.type as keyof typeof t.games.raTypes]
      : null;

  const rows: [string, string][] = [
    [t.games.raPoints2, String(a.points)],
    [t.games.raTrueRatio, String(a.trueRatio)],
    ...(type ? ([[t.games.raType, type]] as [string, string][]) : []),
    [
      t.games.raYouUnlocked,
      a.earned
        ? `${date(a.earnedAt)} · ${a.hardcore ? t.games.raHardcore : t.games.raSoftcore}`
        : t.games.raLocked,
    ],
    ...(a.author
      ? ([[t.games.raAuthor, `${a.author.toUpperCase()} · ${date(a.createdAt)}`]] as [
          string,
          string,
        ][])
      : []),
  ];

  return (
    <BlurOverlay visible={open} onClose={onClose}>
      <View style={[styles.popupWrap, { paddingTop: insets.top }]} pointerEvents="box-none">
        <Appear style={styles.popup}>
          <View style={styles.statsHead}>
            <Image
              source={{ uri: raBadge(a.badge, a.earned) }}
              style={[styles.statsBadge, !a.earned && { opacity: 0.45 }]}
            />
            <View style={styles.latestText}>
              <Text style={styles.popupTitle}>{a.title.toUpperCase()}</Text>
              <Text style={styles.detailDescription}>{a.description}</Text>
            </View>
          </View>

          {players > 0 && (
            <View style={styles.rarity}>
              <View style={styles.rarityRow}>
                <Text style={styles.rarityNumber}>{pct(rate)}</Text>
                <Text style={[styles.label, { flex: 1 }]}>{t.games.raUnlockRate}</Text>
              </View>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${Math.min(rate, 1) * 100}%` }]} />
              </View>
              <Text style={styles.label}>
                {t.games.raOwners(a.numAwarded, players)}
                {'  ·  '}
                {t.games.raHardcoreRate(pct(a.numAwardedHardcore / players))}
              </Text>
            </View>
          )}

          <View style={styles.statsRows}>
            {rows.map(([label, value]) => (
              <View key={label} style={styles.statsRow}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.statsValue}>{value}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.close, pressed && { opacity: 0.7 }]}>
            <Text style={styles.closeText}>{t.games.close}</Text>
          </Pressable>
        </Appear>
      </View>
    </BlurOverlay>
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
/** Cuántos logros recientes se listan arriba de las insignias. */
const LATEST = 5;

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
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.two },
  badgeWrap: { borderRadius: 8, borderWidth: 1, borderColor: 'transparent', padding: 1 },
  badgePicked: { borderColor: C.text },
  badge: { width: BADGE, height: BADGE, borderRadius: 6, backgroundColor: C.backgroundElement },
  // Alto fijo (y texto recortado a pocas líneas) para que el bloque de abajo no se mueva al
  // elegir otro logro.
  detail: {
    height: 132,
    marginBottom: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  chevron: { fontFamily: Type.mono, fontSize: 20, color: C.textSecondary },
  statsHead: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  statsBadge: { width: 80, height: 80, borderRadius: 12, backgroundColor: C.backgroundElement },
  rarity: {
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: Spacing.three,
  },
  rarityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  rarityNumber: { fontFamily: Type.dot, fontSize: 40, lineHeight: 44, color: C.text },
  statsRows: {
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: Spacing.three,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  statsValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: Type.mono,
    fontSize: 11,
    color: C.text,
    letterSpacing: 1,
  },
  detailBadge: { width: 64, height: 64, borderRadius: 10, backgroundColor: C.backgroundElement },
  detailTitle: { fontFamily: Type.dot, fontSize: 20, lineHeight: 24, color: C.text },
  detailDescription: { fontFamily: Type.mono, fontSize: 12, lineHeight: 17, color: C.text },
  latest: { gap: Spacing.three },
  latestRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  latestBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: C.backgroundElement,
  },
  latestText: { flex: 1, gap: 2 },
  latestMeta: { alignItems: 'flex-end', gap: 2 },
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
