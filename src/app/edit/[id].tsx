import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CounterButton } from '@/components/counter-button';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { IconIds, Icons, type IconId } from '@/icons';
import { useTallies } from '@/lib/tallies';

const C = Colors.dark;

/** Editor de un contador: cambiar el nombre y elegir el ícono animado. */
export default function EditTallyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tallies, updateTally } = useTallies();
  const tally = tallies.find((t) => t.id === id);

  const [name, setName] = useState(tally?.name ?? '');
  const [icon, setIcon] = useState<IconId>(tally?.icon ?? 'car');

  if (!tally) {
    return (
      <View style={styles.missing}>
        <Text style={styles.label}>ESTE CONTADOR NO EXISTE</Text>
      </View>
    );
  }

  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    updateTally(tally.id, { name: name.trim(), icon });
    router.back();
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>NOMBRE</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          onSubmitEditing={save}
          placeholder="NOMBRE DEL CONTADOR"
          placeholderTextColor={C.textSecondary}
          returnKeyType="done"
          style={styles.input}
        />

        <Text style={[styles.label, styles.sectionGap]}>ÍCONO · TÓCALOS PARA PROBARLOS</Text>
        <View style={styles.grid}>
          {IconIds.map((iconId) => {
            const selected = iconId === icon;
            return (
              <View key={iconId} style={styles.tile}>
                <View style={{ opacity: selected ? 1 : 0.45 }}>
                  <CounterButton
                    icon={iconId}
                    size={128}
                    onPress={() => setIcon(iconId)}
                    accessibilityLabel={`Elegir ícono ${Icons[iconId].label}`}
                  />
                </View>
                <View style={styles.tileLabelRow}>
                  {selected && <View style={styles.dot} />}
                  <Text style={[styles.tileLabel, selected && styles.tileLabelSelected]}>
                    {Icons[iconId].label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={save}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.saveButton,
            { opacity: !canSave ? 0.3 : pressed ? 0.6 : 1 },
          ]}>
          <Text style={styles.saveText}>GUARDAR</Text>
        </Pressable>
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
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  label: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  sectionGap: { marginTop: Spacing.four },
  input: {
    fontFamily: Type.dot,
    fontSize: 32,
    color: C.text,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: Spacing.four,
    marginTop: Spacing.three,
  },
  tile: { alignItems: 'center', gap: Spacing.two, width: '45%' },
  tileLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  tileLabel: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  tileLabelSelected: { color: C.text },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  saveButton: {
    marginTop: Spacing.five,
    borderWidth: 1,
    borderColor: C.text,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  saveText: { fontFamily: Type.mono, fontSize: 13, color: C.text, letterSpacing: 2 },
});
