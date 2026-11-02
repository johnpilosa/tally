import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Hunt } from '@/animations/config';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useI18n } from '@/lib/i18n';
import { raBadge, type RAAchievement } from '@/lib/retro-achievements';

const C = Colors.dark;
const PAD = Spacing.three;

/** Los niveles de rareza, del más común al más raro, según el % de jugadores que lo tienen. */
export const Tiers = [
  { id: 'common', min: 0.5 },
  { id: 'uncommon', min: 0.2 },
  { id: 'rare', min: 0.05 },
  { id: 'epic', min: 0.01 },
  { id: 'legendary', min: 0 },
] as const;
export type TierId = (typeof Tiers)[number]['id'];

export function tierOf(rate: number) {
  const index = Tiers.findIndex((t) => rate >= t.min);
  return { id: Tiers[index].id, level: index + 1 };
}

/** El % de jugadores que tienen un logro, como texto ("12,4%"). */
export function rarityText(a: RAAchievement, players: number, lang: string) {
  if (!players) return '—';
  const r = a.numAwarded / players;
  return `${(r * 100).toLocaleString(lang, { maximumFractionDigits: r < 0.1 ? 2 : 1 })}%`;
}

/**
 * Un logro como carta coleccionable. Al frente: el nivel de rareza y los puntos arriba, la
 * insignia en grande como ilustración, una franja con el % de jugadores (más roja cuanto más
 * raro), el nombre y qué hay que hacer. `flipped` la da vuelta: atrás van los números y la guía.
 */
export function HuntCard({
  achievement: a,
  players,
  guideUrl,
  flipped,
  width,
  height,
}: {
  achievement: RAAchievement;
  players: number;
  guideUrl: string | null;
  flipped: boolean;
  width: number;
  height: number;
}) {
  const { t, lang } = useI18n();
  // 0 = frente, 1 = atrás. Se achica de costado hasta la mitad y vuelve con la otra cara.
  const side = useSharedValue(flipped ? 1 : 0);
  useEffect(() => {
    side.set(withTiming(flipped ? 1 : 0, { duration: Hunt.flip }));
  }, [flipped, side]);

  const frontStyle = useAnimatedStyle(() => ({
    opacity: side.get() < 0.5 ? 1 : 0,
    transform: [{ scaleX: Math.abs(Math.cos(side.get() * Math.PI)) }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    opacity: side.get() >= 0.5 ? 1 : 0,
    transform: [{ scaleX: Math.abs(Math.cos(side.get() * Math.PI)) }],
  }));

  const rate = players ? a.numAwarded / players : 1;
  const tier = tierOf(rate);
  const type =
    a.type && a.type in t.games.raTypes
      ? t.games.raTypes[a.type as keyof typeof t.games.raTypes]
      : null;
  // La ilustración: cuadrada, lo más grande que deje la carta.
  const art = Math.min(width - PAD * 2, height * 0.44);

  return (
    <View style={{ width, height }}>
      {/* Frente */}
      <Animated.View
        style={[styles.card, StyleSheet.absoluteFill, frontStyle]}
        pointerEvents={flipped ? 'none' : 'auto'}>
        <View style={styles.top}>
          <TierMark level={tier.level} label={t.hunt.tiers[tier.id]} />
          <View style={styles.points}>
            <Text style={styles.pointsText}>{a.points}</Text>
          </View>
        </View>

        <View style={[styles.art, { width: art, height: art }]}>
          <Image
            source={{ uri: raBadge(a.badge, a.earned) }}
            style={{ width: art - 2, height: art - 2 }}
            contentFit="cover"
          />
          {/* El tipo va como etiqueta sobre la ilustración, para no ocupar lugar en la carta. */}
          {type && (
            <View style={[styles.type, a.type === 'missable' && styles.typeDanger]}>
              <Text style={[styles.typeText, a.type === 'missable' && { color: C.accent }]}>
                {type}
              </Text>
            </View>
          )}
        </View>

        <Strip level={tier.level} text={t.hunt.ofPlayersLong(rarityText(a, players, lang))} />

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {a.title.toUpperCase()}
          </Text>
          <Text style={styles.description} numberOfLines={3}>
            {a.description}
          </Text>
        </View>
      </Animated.View>

      {/* Atrás */}
      <Animated.View
        style={[styles.card, StyleSheet.absoluteFill, backStyle]}
        pointerEvents={flipped ? 'box-none' : 'none'}>
        <View style={styles.top}>
          <TierMark level={tier.level} label={t.hunt.tiers[tier.id]} />
          <View style={styles.points}>
            <Text style={styles.pointsText}>{a.points}</Text>
          </View>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {a.title.toUpperCase()}
        </Text>
        <Text style={styles.description}>{a.description}</Text>
        <View style={styles.stats}>
          <Stat label={t.hunt.ofPlayers} value={rarityText(a, players, lang)} />
          <Stat
            label={t.games.raHardcore}
            value={
              players
                ? `${((a.numAwardedHardcore / players) * 100).toLocaleString(lang, { maximumFractionDigits: 1 })}%`
                : '—'
            }
          />
          <Stat label={t.games.raTrueRatio} value={String(a.trueRatio)} />
          <Stat label={t.games.raPoints2} value={String(a.points)} />
        </View>
        <Text style={styles.muted}>{t.hunt.owners(a.numAwarded)}</Text>
        {a.author ? (
          <Text style={styles.muted}>
            {t.games.raAuthor} {a.author.toUpperCase()}
          </Text>
        ) : null}
        {guideUrl && (
          <Pressable
            hitSlop={12}
            onPress={() => WebBrowser.openBrowserAsync(guideUrl)}
            style={({ pressed }) => [styles.guide, pressed && { opacity: 0.6 }]}>
            <Text style={styles.guideText}>{t.hunt.guide}</Text>
          </Pressable>
        )}
        <Text style={[styles.muted, styles.flipHint]}>{t.hunt.tapToFlip}</Text>
      </Animated.View>
    </View>
  );
}

/** El nivel de rareza: cinco puntos (encendidos según el nivel) y su nombre. */
function TierMark({ level, label }: { level: number; label: string }) {
  return (
    <View style={styles.tier}>
      <View style={styles.tierDots}>
        {Tiers.map((_, i) => (
          <View key={i} style={[styles.tierDot, i < level && styles.tierDotOn]} />
        ))}
      </View>
      <Text style={styles.tierText}>{label}</Text>
    </View>
  );
}

/** La franja del %: gris si es común, con borde rojo si es raro, roja entera si es épico o más. */
function Strip({ level, text }: { level: number; text: string }) {
  const filled = level >= 4;
  const outlined = level === 3;
  return (
    <View style={[styles.strip, outlined && styles.stripOutlined, filled && styles.stripFilled]}>
      <Text style={[styles.stripText, outlined && { color: C.accent }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 28,
    backgroundColor: '#111111',
    padding: PAD,
    gap: Spacing.three,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tier: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  tierDots: { flexDirection: 'row', gap: 3 },
  tierDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  tierDotOn: { backgroundColor: C.accent },
  tierText: { fontFamily: Type.mono, fontSize: 11, color: C.text, letterSpacing: 2 },
  points: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsText: { fontFamily: Type.dot, fontSize: 18, color: C.text },
  art: {
    alignSelf: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  strip: {
    borderRadius: 8,
    backgroundColor: C.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  stripOutlined: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.accent },
  stripFilled: { backgroundColor: C.accent },
  stripText: { fontFamily: Type.mono, fontSize: 11, color: C.text, letterSpacing: 1 },
  body: { gap: Spacing.one + 2 },
  title: { fontFamily: Type.dot, fontSize: 24, lineHeight: 28, color: C.text },
  description: { fontFamily: Type.mono, fontSize: 13, lineHeight: 19, color: C.textSecondary },
  type: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  typeDanger: { borderColor: C.accent },
  typeText: { fontFamily: Type.mono, fontSize: 10, color: C.text, letterSpacing: 1 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  stat: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: Spacing.three,
    gap: 2,
  },
  statValue: { fontFamily: Type.dot, fontSize: 24, lineHeight: 28, color: C.text },
  muted: { fontFamily: Type.mono, fontSize: 10, color: C.textSecondary, letterSpacing: 1 },
  guide: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.text,
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  guideText: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  flipHint: { marginTop: 'auto', textAlign: 'center' },
});
