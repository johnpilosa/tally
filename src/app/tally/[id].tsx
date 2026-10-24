import * as Haptics from 'expo-haptics';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { useTallies } from '@/lib/tallies';
import { countSince, formatAgo, formatClock, groupByDay, todayStart } from '@/lib/time';

const WEEK = 7 * 24 * 60 * 60 * 1000;

export default function TallyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tallies, loaded, increment, undo, removeTally } = useTallies();
  const theme = useTheme();
  const now = useNow();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tally = tallies.find((t) => t.id === id);

  if (!tally) {
    return (
      <ThemedView style={styles.missing}>
        {loaded && <ThemedText themeColor="textSecondary">Este contador no existe.</ThemedText>}
      </ThemedView>
    );
  }

  const last = tally.events.at(-1);
  const stats = [
    { label: 'Hoy', value: countSince(tally.events, todayStart(now)) },
    { label: '7 días', value: countSince(tally.events, now - WEEK) },
    { label: 'Total', value: tally.events.length },
  ];

  const onPlus = () => {
    increment(tally.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const onDelete = () => {
    // Dos toques en vez de Alert, porque Alert no funciona en la versión web.
    if (!confirmDelete) return setConfirmDelete(true);
    removeTally(tally.id);
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: tally.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <ThemedText style={[styles.bigCount, { color: tally.color }]}>{tally.events.length}</ThemedText>
          <ThemedText themeColor="textSecondary">
            {last ? `última vez ${formatAgo(last, now)}` : 'todavía sin marcas'}
          </ThemedText>
        </View>

        <Pressable
          onPress={onPlus}
          accessibilityLabel="Sumar uno"
          style={({ pressed }) => [
            styles.bigPlus,
            { backgroundColor: tally.color, transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}>
          <ThemedText style={styles.bigPlusText}>+1</ThemedText>
        </Pressable>

        <Pressable
          onPress={() => undo(tally.id)}
          disabled={!last}
          style={({ pressed }) => [styles.undo, { opacity: !last ? 0.3 : pressed ? 0.6 : 1 }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Deshacer última
          </ThemedText>
        </Pressable>

        <View style={styles.stats}>
          {stats.map((s) => (
            <ThemedView key={s.label} type="backgroundElement" style={styles.stat}>
              <ThemedText style={styles.statValue}>{s.value}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {s.label}
              </ThemedText>
            </ThemedView>
          ))}
        </View>

        {groupByDay(tally.events, now).map((group) => (
          <View key={group.label} style={styles.group}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {group.label} · {group.items.length}
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.groupList}>
              {group.items.map((ts, i) => (
                <View
                  key={`${ts}-${i}`}
                  style={[styles.historyRow, i > 0 && { borderTopColor: theme.backgroundSelected, borderTopWidth: 1 }]}>
                  <View style={[styles.dot, { backgroundColor: tally.color }]} />
                  <ThemedText type="small">{formatClock(ts)}</ThemedText>
                </View>
              ))}
            </ThemedView>
          </View>
        ))}

        <Pressable onPress={onDelete} onBlur={() => setConfirmDelete(false)} style={styles.delete}>
          <ThemedText type="small" style={{ color: '#EF4444' }}>
            {confirmDelete ? '¿Seguro? Toca otra vez para eliminar' : 'Eliminar contador'}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', paddingTop: Spacing.four },
  bigCount: { fontSize: 96, lineHeight: 104, fontWeight: 800, fontVariant: ['tabular-nums'] },
  bigPlus: {
    alignSelf: 'center',
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigPlusText: { fontSize: 48, lineHeight: 56, fontWeight: 800, color: '#fff' },
  undo: { alignSelf: 'center', padding: Spacing.two },
  stats: { flexDirection: 'row', gap: Spacing.two },
  stat: { flex: 1, alignItems: 'center', paddingVertical: Spacing.three, borderRadius: Spacing.three },
  statValue: { fontSize: 24, lineHeight: 30, fontWeight: 700 },
  group: { gap: Spacing.two },
  groupList: { borderRadius: Spacing.three, overflow: 'hidden' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  dot: { width: 8, height: 8, borderRadius: 4 },
  delete: { alignSelf: 'center', padding: Spacing.three, marginTop: Spacing.four },
});
