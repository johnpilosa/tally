import { router, useLocalSearchParams } from 'expo-router';

import { ScreenHeader } from '@/components/screen-header';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { popIn } from '@/animations/presets';

import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useFocusKey } from '@/hooks/use-focus-key';
import { useI18n } from '@/lib/i18n';
import { useTallies } from '@/lib/tallies';
import { countSince, formatAgo, formatClock, groupByDay, todayStart } from '@/lib/time';

const C = Colors.dark;
const WEEK = 7 * 24 * 60 * 60 * 1000;

export default function TallyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tallies, loaded, removeTally } = useTallies();
  const now = useNow();
  const { t, lang } = useI18n();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const focusKey = useFocusKey();

  const tally = tallies.find((t) => t.id === id);

  if (!tally) {
    return (
      <View style={styles.screen}>
        <ScreenHeader back title={t.historyTitle} />
        <View style={styles.missing}>
          {loaded && <Text style={styles.meta}>{t.counterMissing}</Text>}
        </View>
      </View>
    );
  }

  const last = tally.events.at(-1);
  const groups = groupByDay(tally.events, now, lang);
  const stats = [
    { label: t.statToday, value: countSince(tally.events, todayStart(now)) },
    { label: t.statWeek, value: countSince(tally.events, now - WEEK) },
    { label: t.statTotal, value: tally.events.length },
  ];

  const onDelete = () => {
    // Dos toques en vez de Alert, porque Alert no funciona en la versión web.
    if (!confirmDelete) return setConfirmDelete(true);
    removeTally(tally.id);
    router.back();
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader back title={t.historyTitle} />
      <ScrollView contentContainerStyle={styles.content}>
        <View key={focusKey} style={{ gap: Spacing.four }}>
          <Animated.View entering={popIn()} style={styles.hero}>
            <Text style={styles.name}>{tally.name}</Text>
            <Text style={styles.bigCount}>{tally.events.length}</Text>
            <Text style={styles.meta}>
              {last ? t.lastTime(formatAgo(last, now, lang).toUpperCase()) : t.stillNoMarks}
            </Text>
          </Animated.View>

          <Animated.View entering={popIn({ index: 1 })} style={styles.stats}>
            {stats.map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.meta}>{s.label}</Text>
              </View>
            ))}
          </Animated.View>

          {groups.map((group, g) => (
            <Animated.View
              key={group.label}
              entering={popIn({ index: Math.min(g + 2, 8) })}
              style={styles.group}>
              <Text style={styles.meta}>
                {group.label.toUpperCase()} · {group.items.length}
              </Text>
              <View style={styles.groupList}>
                {group.items.map((ts, i) => (
                  <View key={ts} style={[styles.historyRow, i > 0 && styles.rowDivider]}>
                    {/* La marca más reciente lleva el punto rojo. */}
                    <View style={[styles.dot, g === 0 && i === 0 && styles.dotNewest]} />
                    <Text style={styles.time}>{formatClock(ts)}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          ))}

          <Pressable
            onPress={onDelete}
            onBlur={() => setConfirmDelete(false)}
            style={styles.delete}>
            <Text style={[styles.link, { color: C.accent }]}>
              {confirmDelete ? t.confirmAgain : t.deleteCounter}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.background,
  },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.three },
  name: {
    fontFamily: Type.mono,
    fontSize: 14,
    color: C.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  bigCount: { fontFamily: Type.dot, fontSize: 80, lineHeight: 88, color: C.text },
  meta: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  link: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  stats: { flexDirection: 'row', gap: Spacing.two },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Spacing.three,
  },
  statValue: { fontFamily: Type.dot, fontSize: 28, lineHeight: 34, color: C.text },
  group: { gap: Spacing.two },
  groupList: { borderWidth: 1, borderColor: C.border, borderRadius: Spacing.three },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: C.border },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.textSecondary },
  dotNewest: { backgroundColor: C.accent },
  time: { fontFamily: Type.mono, fontSize: 14, color: C.text },
  delete: { alignSelf: 'center', padding: Spacing.three, marginTop: Spacing.four },
});
