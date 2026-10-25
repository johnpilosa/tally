import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CounterButton } from '@/components/counter-button';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { customIconId, customIconRef, IconIds, Icons, type IconRef } from '@/icons';
import { useCustomIcons } from '@/lib/custom-icons';
import { useTallies } from '@/lib/tallies';

const C = Colors.dark;

/** Editor de un contador: cambiar el nombre y elegir el ícono animado. */
export default function EditTallyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tallies, updateTally } = useTallies();
  const tally = tallies.find((t) => t.id === id);

  const [name, setName] = useState(tally?.name ?? '');
  const [icon, setIcon] = useState<IconRef>(tally?.icon ?? 'car');
  const { icons: customIcons, lastCreatedId } = useCustomIcons();

  // Al volver de crear un ícono nuevo, queda elegido.
  const seenCreated = useRef(lastCreatedId);
  useEffect(() => {
    if (!lastCreatedId || lastCreatedId === seenCreated.current) return;
    seenCreated.current = lastCreatedId;
    setIcon(customIconRef(lastCreatedId));
  }, [lastCreatedId]);

  // Si el ícono elegido era uno propio que se borró, queda el auto.
  const chosenCustomId = customIconId(icon);
  const chosen: IconRef =
    chosenCustomId && !customIcons.some((c) => c.id === chosenCustomId) ? 'car' : icon;

  const choices: { ref: IconRef; label: string }[] = [
    ...IconIds.map((iconId) => ({ ref: iconId, label: Icons[iconId].label })),
    ...customIcons.map((c) => ({ ref: customIconRef(c.id), label: c.name.toUpperCase() })),
  ];

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
    updateTally(tally.id, { name: name.trim(), icon: chosen });
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
          {choices.map(({ ref, label }) => {
            const selected = ref === chosen;
            const customId = customIconId(ref);
            return (
              <View key={ref} style={styles.tile}>
                <View style={{ opacity: selected ? 1 : 0.45 }}>
                  <CounterButton
                    icon={ref}
                    size={128}
                    onPress={() => setIcon(ref)}
                    accessibilityLabel={`Elegir ícono ${label}`}
                  />
                </View>
                <View style={styles.tileLabelRow}>
                  {selected && <View style={styles.dot} />}
                  <Text style={[styles.tileLabel, selected && styles.tileLabelSelected]}>
                    {label}
                  </Text>
                  {customId && (
                    <Pressable
                      hitSlop={10}
                      accessibilityLabel={`Editar ícono ${label}`}
                      onPress={() => router.push(`/icon-editor/${customId}`)}>
                      <Text style={styles.tileLabel}>✎</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
          <View style={styles.tile}>
            <Pressable
              onPress={() => router.push('/icon-editor/new')}
              accessibilityLabel="Crear ícono"
              style={({ pressed }) => [styles.newTile, pressed && { opacity: 0.6 }]}>
              <Text style={styles.newTilePlus}>+</Text>
            </Pressable>
            <Text style={styles.tileLabel}>CREAR ÍCONO</Text>
          </View>
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
  newTile: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTilePlus: { fontFamily: Type.dot, fontSize: 40, color: C.textSecondary },
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
