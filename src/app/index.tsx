import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Milestone, SwitchTally } from '@/animations/config';
import { AnimatedCount } from '@/components/animated-count';
import { CounterButton } from '@/components/counter-button';
import { MilestoneBurst } from '@/components/milestone-burst';
import { TallyChips } from '@/components/tally-chips';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTallies } from '@/lib/tallies';
import { countSince, formatDate, todayStart } from '@/lib/time';

const C = Colors.dark;
const BUTTON_SIZE = 240;

type Celebration = { key: number; value: number; big: boolean };

export default function HomeScreen() {
  const { tallies, loaded, current, increment, undo, select, moveTally } = useTallies();
  const now = useNow();
  const [adding, setAdding] = useState(false);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const countScale = useSharedValue(1);
  const countPopStyle = useAnimatedStyle(() => ({ transform: [{ scale: countScale.get() }] }));

  if (!loaded) return <View style={styles.screen} />;

  const first = current?.events[0];
  const last = current?.events.at(-1);
  const today = current ? countSince(current.events, todayStart(now)) : 0;

  const onCount = () => {
    if (!current) return;
    increment(current.id);

    const value = current.events.length + 1;
    if (value % Milestone.every !== 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    // ¡Milestone!
    const big = value % Milestone.bigEvery === 0;
    setCelebrations((c) => [...c, { key: Date.now() + Math.random(), value, big }]);
    countScale.set(
      withSequence(
        withTiming(Milestone.countPop, { duration: 120 }),
        withSpring(1, Milestone.countSpring),
      ),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'web' ? undefined : 'padding'}>
          <View style={styles.topBar}>
            <Text style={styles.brand}>TALLY</Text>
            {current && (
              <Pressable hitSlop={12} onPress={() => router.push(`/tally/${current.id}`)}>
                <Text style={styles.link}>HISTORIAL →</Text>
              </Pressable>
            )}
          </View>

          {current ? (
            <Animated.View
              key={current.id}
              entering={FadeIn.duration(SwitchTally.duration)}
              style={styles.center}>
              <View style={styles.titleBlock}>
                <Pressable
                  hitSlop={12}
                  onPress={() => router.push(`/edit/${current.id}`)}
                  accessibilityLabel="Editar contador"
                  style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {current.name}
                  </Text>
                  <Text style={styles.editHint}>✎</Text>
                </Pressable>
                <Animated.View style={countPopStyle}>
                  <AnimatedCount value={current.events.length} style={styles.count} />
                </Animated.View>
                <Text style={styles.meta}>
                  {first
                    ? `HOY ${today}  ·  DESDE ${formatDate(first, now).toUpperCase()}`
                    : 'SIN MARCAS'}
                </Text>
              </View>

              <View>
                <CounterButton
                  icon={current.icon}
                  size={BUTTON_SIZE}
                  onPress={onCount}
                  accessibilityLabel={`Sumar uno a ${current.name}`}
                />
                {celebrations.map((c) => (
                  <MilestoneBurst
                    key={c.key}
                    value={c.value}
                    big={c.big}
                    size={BUTTON_SIZE}
                    onDone={() => setCelebrations((all) => all.filter((x) => x.key !== c.key))}
                  />
                ))}
              </View>

              <Pressable
                hitSlop={12}
                disabled={!last}
                onPress={() => undo(current.id)}
                style={{ opacity: last ? 1 : 0.3 }}>
                <Text style={styles.link}>DESHACER</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>NADA QUE CONTAR</Text>
              <Text style={styles.meta}>CREA TU PRIMER CONTADOR ABAJO</Text>
            </View>
          )}

          {adding || !current ? (
            <NewTallyInput onDone={() => setAdding(false)} canCancel={!!current} />
          ) : (
            <TallyChips
              tallies={tallies}
              currentId={current.id}
              onSelect={select}
              onMove={moveTally}
              onAdd={() => setAdding(true)}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function NewTallyInput({ onDone, canCancel }: { onDone: () => void; canCancel: boolean }) {
  const { addTally } = useTallies();
  const [name, setName] = useState('');

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addTally(trimmed);
    setName('');
    onDone();
  };

  return (
    <View style={styles.addRow}>
      <TextInput
        value={name}
        onChangeText={setName}
        onSubmitEditing={submit}
        autoFocus={canCancel}
        placeholder="NOMBRE DEL CONTADOR"
        placeholderTextColor={C.textSecondary}
        returnKeyType="done"
        style={styles.input}
      />
      <Pressable
        onPress={submit}
        disabled={!name.trim()}
        style={{ opacity: name.trim() ? 1 : 0.3 }}>
        <Text style={styles.link}>CREAR</Text>
      </Pressable>
      {canCancel && (
        <Pressable onPress={onDone} hitSlop={8}>
          <Text style={[styles.link, { color: C.textSecondary }]}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  brand: { fontFamily: Type.dot, fontSize: 20, color: C.text, letterSpacing: 2 },
  link: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  titleBlock: { alignItems: 'center', gap: Spacing.one },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  editHint: { fontSize: 13, color: C.textSecondary },
  name: {
    fontFamily: Type.mono,
    fontSize: 14,
    color: C.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  count: { fontFamily: Type.dot, fontSize: 96, lineHeight: 104, color: C.text },
  meta: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  emptyTitle: { fontFamily: Type.dot, fontSize: 32, color: C.text, textAlign: 'center' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    margin: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontFamily: Type.mono,
    fontSize: 14,
    color: C.text,
    letterSpacing: 1,
  },
});
