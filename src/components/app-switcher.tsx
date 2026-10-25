import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/animations/appear';
import { Overlay } from '@/animations/config';
import { BlurOverlay } from '@/components/blur-overlay';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useI18n } from '@/lib/i18n';

const C = Colors.dark;
/** Margen interno de cada opción del menú. */
const ITEM_PADDING = Spacing.three;
/** Alto fijo de cada opción y espacio entre ellas: la escalera necesita saber cuánto bajar. */
const ITEM_HEIGHT = 46;
const ITEM_GAP = Spacing.two;

/** Las "apps" dentro de la app. Para agregar otra: súmala aquí y su nombre en `apps` de i18n. */
const APPS = [
  { id: 'tally', route: '/' },
  { id: 'games', route: '/games' },
] as const;

export type AppId = (typeof APPS)[number]['id'];

/**
 * El nombre de la app arriba a la izquierda ("TALLY ▾"). Al tocarlo se abre un menú para
 * cambiar a otra app, con el fondo desenfocado.
 */
export function AppSwitcher({ current }: { current: AppId }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const go = (id: AppId, route: string) => {
    setOpen(false);
    if (id !== current) router.replace(route as '/');
  };

  return (
    <>
      <Pressable
        hitSlop={12}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t.switchApp}
        style={styles.brandRow}>
        <Text style={styles.brand}>{t.apps[current].name}</Text>
        <Text style={styles.caret}>▾</Text>
      </Pressable>

      <BlurOverlay visible={open} onClose={() => setOpen(false)}>
        <View style={[styles.menu, { top: insets.top + Layout.headerHeight }]}>
          {APPS.map((app, i) => {
            const active = app.id === current;
            return (
              <Appear
                key={app.id}
                options={{
                  index: i,
                  direction: -1,
                  distance: ITEM_HEIGHT + ITEM_GAP,
                  stagger: Overlay.ladder.stagger,
                  duration: Overlay.ladder.duration,
                }}
                // Cada opción va por encima de la siguiente, para que la tape mientras sale.
                style={{ zIndex: APPS.length - i }}>
                <Pressable
                  onPress={() => go(app.id, app.route)}
                  style={({ pressed }) => [styles.item, pressed && { opacity: 0.6 }]}>
                  <Text style={[styles.brand, !active && styles.inactive]}>
                    {t.apps[app.id].name}
                  </Text>
                  {active && <View style={styles.dot} />}
                </Pressable>
              </Appear>
            );
          })}
        </View>
      </BlurOverlay>
    </>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  brand: { fontFamily: Type.dot, fontSize: 20, color: C.text, letterSpacing: 2 },
  caret: { fontFamily: Type.mono, fontSize: 12, color: C.textSecondary },
  // El menú queda justo bajo el nombre, con el texto de cada opción alineado al de arriba.
  menu: {
    position: 'absolute',
    left: Layout.gutter - ITEM_PADDING,
    alignItems: 'flex-start',
    gap: ITEM_GAP,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    backgroundColor: C.background,
    paddingHorizontal: ITEM_PADDING,
    height: ITEM_HEIGHT,
  },
  inactive: { color: C.textSecondary },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
});
