import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Appear } from '@/animations/appear';
import { BlurOverlay } from '@/components/blur-overlay';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';

const C = Colors.dark;

export type ChipMenuItem = {
  key: string;
  label: string;
  /** La opción actual: lleva el punto rojo. */
  selected?: boolean;
  /** Una opción secundaria (por ejemplo, ir a otra pantalla): va en gris. */
  muted?: boolean;
  onPress: () => void;
};

/**
 * Un chip con ▾ que abre un menú colgando de él, con el fondo desenfocado. Elegir una opción
 * la aplica y cierra el menú.
 */
export function ChipMenu({
  label,
  active,
  items,
  accessibilityLabel,
  footer,
}: {
  label: string;
  /** Chip con borde blanco (hay algo elegido) o gris (todavía nada). */
  active: boolean;
  items: ChipMenuItem[];
  accessibilityLabel: string;
  /** Algo para mostrar debajo de las opciones, por ejemplo cuando no hay ninguna. */
  footer?: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const trigger = useRef<ComponentRef<typeof View>>(null);
  // El menú cuelga justo debajo del chip y es al menos igual de ancho, con opciones del mismo
  // tamaño y letra que el chip.
  const [menuAt, setMenuAt] = useState<{
    top: number;
    left: number;
    minWidth: number;
    maxWidth: number;
  } | null>(null);

  const open = () =>
    trigger.current?.measureInWindow((x, y, w, h) =>
      setMenuAt({
        top: y + h + Spacing.two,
        left: x,
        minWidth: w,
        maxWidth: width - x - Layout.gutter,
      }),
    );
  const close = () => setMenuAt(null);

  return (
    <>
      <Pressable
        ref={trigger}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          styles.chip,
          active && styles.chipActive,
          pressed && { opacity: 0.7 },
        ]}>
        <Text style={[styles.chipText, active && { color: C.text }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.chipText, styles.caret, active && { color: C.text }]}>▾</Text>
      </Pressable>

      <BlurOverlay visible={!!menuAt} onClose={close}>
        <View style={[styles.menu, menuAt ?? undefined]}>
          {items.map((item, i) => (
            <Appear key={item.key} options={{ direction: -1, index: i }}>
              <Pressable
                onPress={() => {
                  close();
                  item.onPress();
                }}
                accessibilityState={{ selected: !!item.selected }}
                style={({ pressed }) => [
                  styles.item,
                  item.selected && styles.itemSelected,
                  pressed && { opacity: 0.6 },
                ]}>
                <View style={[styles.dot, !item.selected && { opacity: 0 }]} />
                <Text
                  numberOfLines={1}
                  style={[styles.itemText, item.muted && { color: C.textSecondary }]}>
                  {item.label}
                </Text>
              </Pressable>
            </Appear>
          ))}
          {footer}
        </View>
      </BlurOverlay>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    maxWidth: 200,
  },
  chipActive: { borderColor: C.text },
  chipText: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  caret: { fontSize: 9 },
  menu: { position: 'absolute', gap: Spacing.two },
  // Igual que el chip: mismo borde, relleno y letra.
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    backgroundColor: C.background,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  itemSelected: { borderColor: C.text },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  itemText: { fontFamily: Type.mono, fontSize: 11, color: C.text, letterSpacing: 1 },
});
