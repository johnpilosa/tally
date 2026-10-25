import { router, useLocalSearchParams } from 'expo-router';

import { ScreenHeader } from '@/components/screen-header';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CounterButton } from '@/components/counter-button';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { customIconId, customIconRef, IconIds, type IconRef } from '@/icons';
import { useCustomIcons } from '@/lib/custom-icons';
import { useI18n } from '@/lib/i18n';
import { useTallies, type Tally } from '@/lib/tallies';

const C = Colors.dark;

/** Editor de un contador: cambiar el nombre y elegir el ícono animado. */
export default function EditTallyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tallies, loaded } = useTallies();
  const { t } = useI18n();
  const tally = tallies.find((x) => x.id === id);

  // El formulario se arma recién cuando el contador está cargado, para que arranque con sus datos
  // (si se abre esta pantalla directo, los contadores todavía se están leyendo del almacenamiento).
  if (!tally) {
    return (
      <View style={styles.screen}>
        <ScreenHeader back title={t.editTitle} />
        <View style={styles.missing}>
          {loaded && <Text style={styles.label}>{t.counterMissing}</Text>}
        </View>
      </View>
    );
  }
  return <EditTallyForm key={tally.id} tally={tally} />;
}

function EditTallyForm({ tally }: { tally: Tally }) {
  const { updateTally } = useTallies();
  const { t } = useI18n();
  const [name, setName] = useState(tally.name);
  const [icon, setIcon] = useState<IconRef>(tally.icon ?? 'car');
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
    ...IconIds.map((iconId) => ({ ref: iconId as IconRef, label: t.icons[iconId] })),
    ...customIcons.map((c) => ({ ref: customIconRef(c.id), label: c.name.toUpperCase() })),
  ];

  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    updateTally(tally.id, { name: name.trim(), icon: chosen });
    router.back();
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader back title={t.editTitle} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>{t.name}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          onSubmitEditing={save}
          placeholder={t.counterNamePlaceholder}
          placeholderTextColor={C.textSecondary}
          returnKeyType="done"
          style={styles.input}
        />

        <Text style={[styles.label, styles.sectionGap]}>{t.iconTryThem}</Text>
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
                    accessibilityLabel={t.chooseIcon(label)}
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
                      accessibilityLabel={t.editIcon(label)}
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
              accessibilityLabel={t.createIconA11y}
              style={({ pressed }) => [styles.newTile, pressed && { opacity: 0.6 }]}>
              <Text style={styles.newTilePlus}>+</Text>
            </Pressable>
            <Text style={styles.tileLabel}>{t.createIcon}</Text>
          </View>
        </View>

        <Pressable
          onPress={save}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.saveButton,
            { opacity: !canSave ? 0.3 : pressed ? 0.6 : 1 },
          ]}>
          <Text style={styles.saveText}>{t.save}</Text>
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
