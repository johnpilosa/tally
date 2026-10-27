import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/animations/appear';
import { BlurOverlay } from '@/components/blur-overlay';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useGames, type Game } from '@/lib/games';
import { useI18n } from '@/lib/i18n';
import { useProfile } from '@/lib/profile';

const C = Colors.dark;

/**
 * En qué plataformas jugaste un juego. El chip muestra solo las elegidas; al tocarlo se abre
 * una ventana con todas las de tu perfil para marcar una o varias, y para agregar una nueva.
 */
export function PlatformPicker({ game }: { game: Game }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const chosen = game.platforms ?? [];
  const label =
    chosen.length === 0
      ? `+ ${t.games.platform}`
      : chosen.length === 1
        ? chosen[0].toUpperCase()
        : `${chosen[0].toUpperCase()} +${chosen.length - 1}`;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t.games.platform}
        style={({ pressed }) => [
          styles.trigger,
          chosen.length > 0 && styles.triggerOn,
          pressed && { opacity: 0.7 },
        ]}>
        <Text
          numberOfLines={1}
          style={[styles.triggerText, chosen.length > 0 && { color: C.text }]}>
          {label}
        </Text>
      </Pressable>
      <PlatformPopup game={game} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function PlatformPopup({
  game,
  open,
  onClose,
}: {
  game: Game;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { updateGame } = useGames();
  const { profile, addPlatform } = useProfile();
  const insets = useSafeAreaInsets();
  const chosen = game.platforms ?? [];
  // Las del perfil, más alguna que el juego tenga y ya no esté en el perfil.
  const options = [...profile.platforms, ...chosen.filter((p) => !profile.platforms.includes(p))];

  const toggle = (p: string) =>
    updateGame(game.id, {
      platforms: chosen.includes(p) ? chosen.filter((x) => x !== p) : [...chosen, p],
    });

  // Una nueva queda en tu perfil y marcada en este juego.
  const create = (name: string) => {
    const existing = options.find((p) => p.toLowerCase() === name.toLowerCase());
    const p = existing ?? name;
    if (!existing) addPlatform(name);
    if (!chosen.includes(p)) updateGame(game.id, { platforms: [...chosen, p] });
  };

  return (
    <BlurOverlay visible={open} onClose={onClose}>
      <View style={[styles.wrap, { paddingTop: insets.top }]} pointerEvents="box-none">
        <Appear style={styles.popup}>
          <Text style={styles.label}>{t.games.playedOn}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {game.title.toUpperCase()}
          </Text>

          {options.length === 0 ? (
            <Text style={styles.label}>{t.games.noPlatforms}</Text>
          ) : (
            <ScrollView style={styles.options} contentContainerStyle={styles.chips}>
              {options.map((p) => {
                const on = chosen.includes(p);
                return (
                  <Pressable
                    key={p}
                    onPress={() => toggle(p)}
                    accessibilityState={{ selected: on }}
                    style={({ pressed }) => [
                      styles.chip,
                      on && styles.chipOn,
                      pressed && { opacity: 0.6 },
                    ]}>
                    {on && <View style={styles.dot} />}
                    <Text style={[styles.chipText, on && { color: C.text }]}>
                      {p.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <NewPlatformForm onCreate={create} />

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.done, pressed && { opacity: 0.7 }]}>
            <Text style={styles.doneText}>{t.games.done}</Text>
          </Pressable>
        </Appear>
      </View>
    </BlurOverlay>
  );
}

/**
 * Campo para agregar una plataforma. Guarda lo que escribes por su cuenta: dentro de la ventana
 * flotante, si el texto viniera de afuera llegaría tarde y se perderían letras.
 */
function NewPlatformForm({ onCreate }: { onCreate: (name: string) => void }) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const create = () => {
    const clean = name.trim();
    if (!clean) return;
    onCreate(clean);
    setName('');
  };
  return (
    <View style={styles.newRow}>
      <TextInput
        value={name}
        onChangeText={setName}
        onSubmitEditing={create}
        placeholder={t.games.platformPlaceholder}
        placeholderTextColor={C.textSecondary}
        returnKeyType="done"
        style={styles.newInput}
      />
      <Pressable
        onPress={create}
        disabled={!name.trim()}
        style={{ opacity: name.trim() ? 1 : 0.3 }}>
        <Text style={styles.link}>{t.games.addInsight}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    maxWidth: 200,
  },
  triggerOn: { borderColor: C.text },
  triggerText: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  popup: {
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Layout.popupRadius,
    backgroundColor: C.background,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  label: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  link: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 1 },
  title: { fontFamily: Type.dot, fontSize: 26, lineHeight: 30, color: C.text },
  options: { maxHeight: 260, flexGrow: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
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
  chipOn: { borderColor: C.text },
  chipText: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  newRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  newInput: { flex: 1, minHeight: 44, fontFamily: Type.mono, fontSize: 12, color: C.text },
  done: {
    borderWidth: 1,
    borderColor: C.text,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  doneText: { fontFamily: Type.mono, fontSize: 13, color: C.text, letterSpacing: 2 },
});
