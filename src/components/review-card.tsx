import { Image } from 'expo-image';
import { forwardRef, type ComponentRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Stars } from '@/components/star-rating';
import { Colors, Spacing, Type } from '@/constants/theme';
import { RatingCategories, reviewOf, type Game } from '@/lib/games';
import { useI18n } from '@/lib/i18n';

const C = Colors.dark;

/** Ancho fijo de la tarjeta, para que la imagen salga igual en cualquier pantalla. */
export const REVIEW_CARD_WIDTH = 360;

/**
 * La reseña armada como una tarjeta para exportar como imagen: portada, título, estado, la
 * reseña completa, las estrellas de cada categoría y el puntaje final.
 */
export const ReviewCard = forwardRef<ComponentRef<typeof View>, { game: Game }>(function ReviewCard(
  { game },
  ref,
) {
  const { t } = useI18n();
  const written = reviewOf(game);
  const rated = RatingCategories.filter((cat) => game.ratings[cat]);

  return (
    // collapsable={false}: en Android, sin esto la vista puede no existir y no se captura.
    <View ref={ref} collapsable={false} style={styles.card}>
      <View style={styles.header}>
        {game.coverUrl ? (
          <Image source={{ uri: game.coverUrl }} style={styles.cover} contentFit="cover" />
        ) : (
          <View style={styles.cover} />
        )}
        <View style={styles.headerText}>
          <Text style={styles.title}>{game.title.toUpperCase()}</Text>
          <View style={styles.chips}>
            <View style={[styles.chip, styles.chipActive]}>
              <Text style={[styles.chipText, { color: C.text }]}>{t.games[game.status]}</Text>
            </View>
            {game.favorite && (
              <View style={[styles.chip, { borderColor: C.accent }]}>
                <Text style={[styles.chipText, { color: C.accent }]}>♥</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.box}>
        <Text style={styles.label}>{t.games.yourReview}</Text>
        {written.title ? <Text style={styles.reviewTitle}>{written.title}</Text> : null}
        {written.subtitle ? <Text style={styles.subtitle}>{written.subtitle}</Text> : null}
        {written.body ? <Text style={styles.body}>{written.body}</Text> : null}
      </View>

      {(rated.length > 0 || game.ratings.overall) && (
        <View style={styles.box}>
          <Text style={styles.label}>{t.games.ratings}</Text>
          {rated.map((cat) => (
            <View key={cat} style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>{t.games.categories[cat]}</Text>
              <Stars value={game.ratings[cat]} size={14} />
            </View>
          ))}
          <View style={[styles.ratingRow, rated.length > 0 && styles.overallRow]}>
            <Text style={styles.overallLabel}>{t.games.overall}</Text>
            <Stars value={game.ratings.overall} size={22} color={C.accent} />
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.dot} />
        <Text style={styles.label}>RETRO LOG</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: REVIEW_CARD_WIDTH,
    backgroundColor: C.background,
    padding: Spacing.four,
    gap: Spacing.four,
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
  title: { fontFamily: Type.dot, fontSize: 24, lineHeight: 28, color: C.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipActive: { borderColor: C.text },
  chipText: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  box: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  label: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  reviewTitle: { fontFamily: Type.dot, fontSize: 24, lineHeight: 28, color: C.text },
  subtitle: { fontFamily: Type.mono, fontSize: 13, lineHeight: 19, color: C.textSecondary },
  body: { fontFamily: Type.mono, fontSize: 13, lineHeight: 20, color: C.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingLabel: { fontFamily: Type.mono, fontSize: 11, color: C.text, letterSpacing: 1 },
  overallRow: {
    marginTop: Spacing.one,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  overallLabel: { fontFamily: Type.dot, fontSize: 20, color: C.text, letterSpacing: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
});
