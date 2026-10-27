import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Appear } from '@/animations/appear';

import { BlurOverlay } from '@/components/blur-overlay';
import { GamesMenuButton } from '@/components/games-nav';
import { ChipMenu } from '@/components/chip-menu';
import { ListPicker } from '@/components/list-picker';
import { PlatformPicker } from '@/components/platform-picker';
import { RAAchievements } from '@/components/ra-achievements';
import { ScreenHeader } from '@/components/screen-header';
import { StarRating } from '@/components/star-rating';
import { Colors, Layout, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { newId, RatingCategories, reviewOf, useGames, type Game } from '@/lib/games';
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
  const { updateGame } = useGames();
  const { t, lang } = useI18n();
  const now = useNow();
  const [insight, setInsight] = useState('');

  const update = (changes: Partial<Game>) => updateGame(game.id, changes);
  const written = reviewOf(game);
  const hasReview = !!(written.title || written.subtitle || written.body);

  const addInsight = () => {
    const text = insight.trim();
    if (!text) return;
    update({ insights: [{ id: newId(), text, createdAt: Date.now() }, ...game.insights] });
    setInsight('');
  };

  const setRating = (key: keyof Game['ratings'], value: number | undefined) =>
    update({ ratings: { ...game.ratings, [key]: value } });

  return (
    <View style={styles.screen}>
      <ScreenHeader back="/games" title={t.games.reviewTitle} right={<GamesMenuButton />} />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={Spacing.four}>
        {/* Encabezado: portada, título, estado y favorito */}
        <Appear style={styles.header}>
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
              <ChipMenu
                label={t.games[game.status]}
                active
                accessibilityLabel={t.games.statusLabel}
                items={(['playing', 'played'] as const).map((st) => ({
                  key: st,
                  label: t.games[st],
                  selected: game.status === st,
                  onPress: () => update({ status: st }),
                }))}
              />
              <PlatformPicker game={game} />
              <GameOptions game={game} />
            </View>
          </View>
        </Appear>

        {/* Notas */}
        <Section label={t.games.yourReview}>
          <Pressable
            onPress={() => router.push({ pathname: '/games/write', params: { id: game.id } })}
            style={({ pressed }) => [styles.reviewCard, pressed && { opacity: 0.6 }]}>
            {written.title ? <Text style={styles.reviewTitle}>{written.title}</Text> : null}
            {written.subtitle ? (
              <Text style={styles.reviewSubtitle}>{written.subtitle}</Text>
            ) : null}
            {written.body ? (
              <Text style={styles.reviewExcerpt} numberOfLines={4}>
                {written.body}
              </Text>
            ) : null}
            <Text style={styles.link}>{hasReview ? t.games.editReview : t.games.startReview}</Text>
          </Pressable>
          {hasReview && (
            <Pressable
              onPress={() => router.push({ pathname: '/games/share', params: { id: game.id } })}
              style={({ pressed }) => pressed && { opacity: 0.6 }}>
              <Text style={styles.link}>{t.games.shareAsImage}</Text>
            </Pressable>
          )}
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
              <Appear key={ins.id} style={styles.insight}>
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
              </Appear>
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

        {/* Logros de RetroAchievements, al final */}
        <Section label={t.games.raAchievements}>
          <RAAchievements game={game} />
        </Section>
      </KeyboardAwareScrollView>
    </View>
  );
}

/**
 * El botón ♥ ▾ junto al estado: abre un menú que cuelga de él con favorito, listas y quitar el
 * juego. Quitar pide un segundo toque para confirmar.
 */
function GameOptions({ game }: { game: Game }) {
  const { updateGame, removeGame } = useGames();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const trigger = useRef<ComponentRef<typeof View>>(null);
  const [menuAt, setMenuAt] = useState<{ top: number; left: number } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);

  const open = () =>
    trigger.current?.measureInWindow((x, y, _w, h) => {
      setConfirmRemove(false);
      setMenuAt({
        top: y + h + Spacing.two,
        left: Math.max(Layout.gutter, Math.min(x, width - MENU_WIDTH - Layout.gutter)),
      });
    });
  const close = () => setMenuAt(null);

  const items: {
    key: string;
    icon: string;
    label: string;
    danger?: boolean;
    onPress: () => void;
  }[] = [
    {
      key: 'favorite',
      icon: '♥',
      label: game.favorite ? t.games.removeFavorite : t.games.addFavorite,
      onPress: () => {
        updateGame(game.id, { favorite: !game.favorite });
        close();
      },
    },
    {
      key: 'lists',
      icon: '≡',
      label: game.listIds.length ? t.games.inLists(game.listIds.length) : t.games.addToList,
      onPress: () => {
        close();
        setListsOpen(true);
      },
    },
    {
      key: 'remove',
      icon: '✕',
      label: confirmRemove ? t.confirmAgain : t.games.removeGame,
      danger: true,
      onPress: () => {
        if (!confirmRemove) return setConfirmRemove(true);
        close();
        removeGame(game.id);
        if (router.canGoBack()) router.back();
        else router.replace('/games');
      },
    },
  ];

  return (
    <>
      <Pressable
        ref={trigger}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={t.games.gameOptions}
        style={[styles.chip, styles.optionsChip, game.favorite && styles.chipFavorite]}>
        <Text style={[styles.chipText, game.favorite && { color: C.accent }]}>♥</Text>
        <Text style={[styles.chipText, styles.caret]}>▾</Text>
      </Pressable>

      <BlurOverlay visible={!!menuAt} onClose={close}>
        <View style={[styles.menu, menuAt ?? undefined]}>
          {items.map((item, i) => (
            <Appear key={item.key} options={{ direction: -1, index: i }}>
              <Pressable
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.menuItem,
                  item.danger && { borderColor: C.accent },
                  pressed && { opacity: 0.6 },
                ]}>
                <Text
                  style={[
                    styles.menuIcon,
                    item.key === 'favorite' && game.favorite && { color: C.accent },
                    item.danger && { color: C.accent },
                  ]}>
                  {item.icon}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.menuText, item.danger && { color: C.accent }]}>
                  {item.label}
                </Text>
              </Pressable>
            </Appear>
          ))}
        </View>
      </BlurOverlay>

      <ListPicker gameId={listsOpen ? game.id : null} onClose={() => setListsOpen(false)} />
    </>
  );
}

const MENU_WIDTH = 280;

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Appear options={{ index: 2 }} style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </Appear>
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
  reviewCard: { gap: Spacing.two },
  reviewTitle: { fontFamily: Type.dot, fontSize: 24, lineHeight: 28, color: C.text },
  reviewSubtitle: { fontFamily: Type.mono, fontSize: 13, lineHeight: 19, color: C.textSecondary },
  reviewExcerpt: { fontFamily: Type.mono, fontSize: 13, lineHeight: 20, color: C.text },
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
  optionsChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  caret: { fontSize: 9 },
  menu: { position: 'absolute', width: MENU_WIDTH, gap: Spacing.two },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    backgroundColor: C.background,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  menuIcon: { fontFamily: Type.mono, fontSize: 13, color: C.text, width: 14, textAlign: 'center' },
  menuText: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
});
