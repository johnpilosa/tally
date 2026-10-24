import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { useTallies, type Tally } from '@/lib/tallies';
import { countSince, formatAgo, todayStart } from '@/lib/time';

export default function HomeScreen() {
  const { tallies, loaded, addTally } = useTallies();
  const theme = useTheme();
  const [name, setName] = useState('');

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addTally(trimmed);
    setName('');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'web' ? undefined : 'padding'}>
          <FlatList
            data={tallies}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => <TallyRow tally={item} />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              loaded ? (
                <View style={styles.empty}>
                  <ThemedText type="subtitle" style={styles.center}>
                    Nada que contar… aún
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.center}>
                    Crea un contador abajo. Por ejemplo: "café", "bostezos" o "veces que
                    revisé el celular".
                  </ThemedText>
                </View>
              ) : undefined
            }
          />

          <View style={styles.addRow}>
            <TextInput
              value={name}
              onChangeText={setName}
              onSubmitEditing={submit}
              placeholder="Nuevo contador…"
              placeholderTextColor={theme.textSecondary}
              returnKeyType="done"
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
            <Pressable
              onPress={submit}
              disabled={!name.trim()}
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: theme.text, opacity: !name.trim() ? 0.3 : pressed ? 0.7 : 1 },
              ]}>
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                Agregar
              </ThemedText>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function TallyRow({ tally }: { tally: Tally }) {
  const { increment } = useTallies();
  const now = useNow();
  const last = tally.events.at(-1);
  const today = countSince(tally.events, todayStart(now));

  const onPlus = () => {
    increment(tally.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={[styles.colorBar, { backgroundColor: tally.color }]} />
      <Pressable
        onPress={() => router.push(`/tally/${tally.id}`)}
        style={({ pressed }) => [styles.cardInfo, pressed && styles.pressed]}>
        <ThemedText type="default" numberOfLines={1}>
          {tally.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {last ? `${formatAgo(last, now)} · hoy ${today}` : 'sin marcas'}
        </ThemedText>
      </Pressable>
      <ThemedText style={styles.count}>{tally.events.length}</ThemedText>
      <Pressable
        onPress={onPlus}
        hitSlop={8}
        accessibilityLabel={`Sumar uno a ${tally.name}`}
        style={({ pressed }) => [
          styles.plus,
          { backgroundColor: tally.color, transform: [{ scale: pressed ? 0.9 : 1 }] },
        ]}>
        <ThemedText style={styles.plusText}>+</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  flex: { flex: 1 },
  list: { padding: Spacing.three, gap: Spacing.two, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  center: { textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingRight: Spacing.three,
    overflow: 'hidden',
    minHeight: 72,
  },
  colorBar: { width: 6, alignSelf: 'stretch' },
  cardInfo: { flex: 1, paddingVertical: Spacing.three, paddingLeft: Spacing.three },
  pressed: { opacity: 0.6 },
  count: { fontSize: 28, lineHeight: 34, fontWeight: 700, marginHorizontal: Spacing.three, fontVariant: ['tabular-nums'] },
  plus: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  plusText: { fontSize: 28, lineHeight: 32, fontWeight: 700, color: '#fff' },
  addRow: { flexDirection: 'row', gap: Spacing.two, padding: Spacing.three },
  input: { flex: 1, borderRadius: Spacing.three, paddingHorizontal: Spacing.three, fontSize: 16, minHeight: 48 },
  addButton: { borderRadius: Spacing.three, paddingHorizontal: Spacing.three, justifyContent: 'center' },
});
