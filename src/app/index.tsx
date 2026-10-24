import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SwitchTally } from '@/animations/config';
import { AnimatedCount } from '@/components/animated-count';
import { CounterButton } from '@/components/counter-button';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTallies } from '@/lib/tallies';
import { countSince, formatAgo, todayStart } from '@/lib/time';

const C = Colors.dark;

export default function HomeScreen() {
  const { tallies, loaded, current, increment, undo, select } = useTallies();
  const now = useNow();
  const [adding, setAdding] = useState(false);

  if (!loaded) return <View style={styles.screen} />;

  const last = current?.events.at(-1);
  const today = current ? countSince(current.events, todayStart(now)) : 0;

  const onCount = () => {
    if (!current) return;
    increment(current.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                <AnimatedCount value={current.events.length} style={styles.count} />
                <Text style={styles.meta}>
                  {last ? `HOY ${today}  ·  ${formatAgo(last, now).toUpperCase()}` : 'SIN MARCAS'}
                </Text>
              </View>

              <CounterButton
                icon={current.icon}
                onPress={onCount}
                accessibilityLabel={`Sumar uno a ${current.name}`}
              />

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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chips}>
              {tallies.map((t) => {
                const active = t.id === current.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => select(t.id)}
                    style={[styles.chip, active && styles.chipActive]}>
                    {active && <View style={styles.dot} />}
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {t.name.toUpperCase()} {t.events.length}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable onPress={() => setAdding(true)} style={styles.chip}>
                <Text style={styles.chipText}>+ NUEVO</Text>
              </Pressable>
            </ScrollView>
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
  chipsScroll: { flexGrow: 0 },
  chips: { gap: Spacing.two, paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipActive: { borderColor: C.text },
  chipText: { fontFamily: Type.mono, fontSize: 12, color: C.textSecondary },
  chipTextActive: { color: C.text },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
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
