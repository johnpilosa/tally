import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { popIn } from '@/animations/presets';
import { BlurOverlay } from '@/components/blur-overlay';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';
import { useI18n } from '@/lib/i18n';

const C = Colors.dark;

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
              <Animated.View key={app.id} entering={popIn({ direction: -1, index: i })}>
                <Pressable
                  onPress={() => go(app.id, app.route)}
                  style={({ pressed }) => [styles.item, pressed && { opacity: 0.6 }]}>
                  <View style={styles.itemTitleRow}>
                    {active && <View style={styles.dot} />}
                    <Text style={[styles.itemName, !active && styles.itemNameInactive]}>
                      {t.apps[app.id].name}
                    </Text>
                  </View>
                  <Text style={styles.itemHint}>{t.apps[app.id].hint}</Text>
                </Pressable>
              </Animated.View>
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
  menu: {
    position: 'absolute',
    left: Layout.gutter,
    right: Layout.gutter,
    maxWidth: 360,
    gap: Spacing.two,
  },
  item: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Spacing.four,
    backgroundColor: C.background,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  itemName: { fontFamily: Type.dot, fontSize: 28, color: C.text, letterSpacing: 2 },
  itemNameInactive: { color: C.textSecondary },
  itemHint: { fontFamily: Type.mono, fontSize: 11, color: C.textSecondary, letterSpacing: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
});
