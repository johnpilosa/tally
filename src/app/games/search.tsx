import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { useGames } from '@/lib/games';
import { useI18n } from '@/lib/i18n';
import { searchGames, yearOf, type GameHit } from '@/lib/wiki-games';

const C = Colors.dark;
/** Espera tras la última tecla antes de buscar, para no buscar en cada letra. */
const DEBOUNCE_MS = 250;

/** Buscar un juego: a medida que escribes aparece la lista de juegos que coinciden. */
export default function SearchGameScreen() {
  const { t } = useI18n();
  const { games } = useGames();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GameHit[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  // Con menos de 2 letras no se busca: se muestra la ayuda en vez de resultados.
  const q = query.trim();
  const active = q.length >= 2;
  const shownHits = active ? hits : [];
  const shownState = active ? state : 'idle';

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState('loading');
      searchGames(q, controller.signal)
        .then((found) => {
          setHits(found);
          setState('done');
        })
        .catch((e) => {
          if (e.name !== 'AbortError') setState('error');
        });
    }, DEBOUNCE_MS);
    // Si escribes otra letra antes de que llegue la respuesta, se cancela la búsqueda anterior.
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, active]);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: t.games.addGame }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCorrect={false}
          placeholder={t.games.searchPlaceholder}
          placeholderTextColor={C.textSecondary}
          style={styles.input}
        />
        <Text style={styles.hint}>
          {shownState === 'loading'
            ? t.games.searching
            : shownState === 'error'
              ? t.games.offline
              : shownState === 'done' && shownHits.length === 0
                ? t.games.noResults
                : shownState === 'idle'
                  ? t.games.searchHint
                  : ' '}
        </Text>

        {shownHits.length > 0 && (
          <Animated.View entering={FadeIn.duration(150)} style={styles.dropdown}>
            {shownHits.map((hit, i) => {
              const added = games.some((g) => g.id === hit.key);
              return (
                <Animated.View key={hit.key} entering={FadeInDown.delay(i * 25).duration(180)}>
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: '/games/game', params: { key: hit.key } })
                    }
                    style={({ pressed }) => [
                      styles.hit,
                      i > 0 && styles.hitDivider,
                      pressed && { backgroundColor: C.backgroundSelected },
                    ]}>
                    <View style={styles.hitText}>
                      <Text style={styles.hitTitle} numberOfLines={2}>
                        {hit.title.toUpperCase()}
                      </Text>
                      <Text style={styles.hitMeta}>
                        {yearOf(hit.description) ?? hit.description.toUpperCase()}
                      </Text>
                    </View>
                    {added && <View style={styles.dot} />}
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        <Text style={[styles.hint, styles.source]}>{t.games.source}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  input: {
    fontFamily: Type.dot,
    fontSize: 28,
    color: C.text,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: Spacing.two,
  },
  hint: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  source: { marginTop: Spacing.four, textAlign: 'center' },
  dropdown: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  hit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  hitDivider: { borderTopWidth: 1, borderTopColor: C.border },
  hitText: { flex: 1, gap: 2 },
  hitTitle: { fontFamily: Type.mono, fontSize: 13, color: C.text, letterSpacing: 1 },
  hitMeta: { fontFamily: Type.mono, fontSize: 10, color: C.textSecondary, letterSpacing: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
});
