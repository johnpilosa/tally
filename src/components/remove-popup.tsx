import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/animations/appear';
import { BlurOverlay } from '@/components/blur-overlay';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useI18n } from '@/lib/i18n';

const C = Colors.dark;

/**
 * Ventana para confirmar que quieres quitar un juego (de una lista o de mis juegos). Aparece al
 * mantener presionado un juego. `title` es el juego; `label`, de dónde se quita.
 */
export function RemovePopup({
  title,
  label,
  onConfirm,
  onClose,
}: {
  /** El juego a quitar, o null para que la ventana esté cerrada. */
  title: string | null;
  label: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <BlurOverlay visible={title !== null} onClose={onClose}>
      <View style={[styles.wrap, { paddingTop: insets.top }]} pointerEvents="box-none">
        <Appear style={styles.popup}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.title} numberOfLines={3}>
            {title?.toUpperCase()}
          </Text>
          <View style={styles.buttons}>
            <Pressable
              onPress={() => {
                onConfirm();
                onClose();
              }}
              style={({ pressed }) => [styles.button, styles.danger, pressed && { opacity: 0.7 }]}>
              <Text style={[styles.buttonText, { color: C.accent }]}>{t.games.remove}</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}>
              <Text style={styles.buttonText}>{t.games.cancel}</Text>
            </Pressable>
          </View>
        </Appear>
      </View>
    </BlurOverlay>
  );
}

const styles = StyleSheet.create({
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
  title: { fontFamily: Type.dot, fontSize: 26, lineHeight: 30, color: C.text },
  buttons: { gap: Spacing.two, marginTop: Spacing.two },
  button: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  danger: { borderColor: C.accent },
  buttonText: { fontFamily: Type.mono, fontSize: 13, color: C.text, letterSpacing: 2 },
});
