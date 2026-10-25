import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Milestone } from '@/animations/config';
import { Appear } from '@/animations/appear';
import { AnimatedCount } from '@/components/animated-count';
import { ScreenHeader } from '@/components/screen-header';
import { CounterButton } from '@/components/counter-button';
import { MilestoneBurst } from '@/components/milestone-burst';
import { TallyChips } from '@/components/tally-chips';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useFocusKey } from '@/hooks/use-focus-key';
import { useI18n } from '@/lib/i18n';
import { useTallies } from '@/lib/tallies';
import { countSince, formatDate, todayStart } from '@/lib/time';

const C = Colors.dark;
const BUTTON_SIZE = 240;

type Celebration = { key: number; value: number; big: boolean };

export default function HomeScreen() {
  const { tallies, loaded, current, increment, undo, select, moveTally } = useTallies();
  const now = useNow();
  const { t, lang } = useI18n();
  const [adding, setAdding] = useState(false);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const focusKey = useFocusKey();
  const insets = useSafeAreaInsets();
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
      <ScreenHeader
        app="tally"
        right={
          <>
            <LangToggle />
            {current && (
              <Pressable hitSlop={12} onPress={() => router.push(`/tally/${current.id}`)}>
                <Text style={styles.link}>{t.history}</Text>
              </Pressable>
            )}
          </>
        }
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {current ? (
          <Appear
            key={`${current.id}-${focusKey}`}

            style={styles.center}>
            <View style={styles.titleBlock}>
              <Pressable
                hitSlop={12}
                onPress={() => router.push(`/edit/${current.id}`)}
                accessibilityLabel={t.editCounter}
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
                  ? t.todaySince(today, formatDate(first, now, lang).toUpperCase())
                  : t.noMarks}
              </Text>
            </View>

            <View>
              <CounterButton
                icon={current.icon}
                size={BUTTON_SIZE}
                onPress={onCount}
                accessibilityLabel={t.addOneTo(current.name)}
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
              <Text style={styles.link}>{t.undo}</Text>
            </Pressable>
          </Appear>
        ) : (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
            <Text style={styles.meta}>{t.emptyHint}</Text>
          </View>
        )}

        {/* Lo de abajo sube con el teclado, para ver lo que escribes en el nombre nuevo. El
              margen de abajo de la pantalla ya queda tapado por el teclado, así que se descuenta. */}
        <KeyboardStickyView
          offset={{ opened: insets.bottom - Spacing.two }}
          style={{ backgroundColor: C.background }}>
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
        </KeyboardStickyView>
      </SafeAreaView>
    </View>
  );
}

/** "EN · ES": el idioma activo en blanco, el otro en gris. */
function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <View style={styles.langToggle}>
      {(['en', 'es'] as const).map((code, i) => (
        <View key={code} style={styles.langItem}>
          {i > 0 && <Text style={styles.langSeparator}>·</Text>}
          <Pressable
            hitSlop={8}
            onPress={() => setLang(code)}
            accessibilityRole="button"
            accessibilityState={{ selected: lang === code }}>
            <Text style={[styles.link, lang !== code && styles.langInactive]}>
              {code.toUpperCase()}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function NewTallyInput({ onDone, canCancel }: { onDone: () => void; canCancel: boolean }) {
  const { addTally } = useTallies();
  const { t } = useI18n();
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
        placeholder={t.counterNamePlaceholder}
        placeholderTextColor={C.textSecondary}
        returnKeyType="done"
        style={styles.input}
      />
      <Pressable
        onPress={submit}
        disabled={!name.trim()}
        style={{ opacity: name.trim() ? 1 : 0.3 }}>
        <Text style={styles.link}>{t.create}</Text>
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
  screen: { flex: 1, backgroundColor: C.background },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  langToggle: { flexDirection: 'row', alignItems: 'center' },
  langItem: { flexDirection: 'row', alignItems: 'center' },
  langSeparator: {
    fontFamily: Type.mono,
    fontSize: 12,
    color: C.textSecondary,
    marginHorizontal: Spacing.two,
  },
  langInactive: { color: C.textSecondary },
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
