import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppSwitcher, type AppId } from '@/components/app-switcher';
import { Colors, Layout, Spacing, Type } from '@/constants/theme';

const C = Colors.dark;

/**
 * La barra de arriba de TODAS las pantallas, para que todas se vean igual: mismo alto, mismos
 * márgenes, mismo lugar para cada cosa.
 *
 * - Izquierda: el nombre de la app con su menú (`app`), o una flecha para volver (`back`).
 *   `back` puede ser la ruta a la que ir si no hay pantalla anterior (por ejemplo, al abrir un link).
 * - Al lado de la flecha, un título corto opcional.
 * - Derecha: lo que la pantalla necesite (menú •••, "+ ADD", idioma…).
 */
export function ScreenHeader({
  app,
  back,
  title,
  right,
}: {
  app?: AppId;
  back?: boolean | string;
  title?: string;
  right?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace((typeof back === 'string' ? back : '/') as '/');
  };

  return (
    <View style={[styles.bar, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <View style={styles.left}>
          {app && <AppSwitcher current={app} />}
          {back && (
            <Pressable
              hitSlop={12}
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={styles.back}>
              <Svg width={22} height={22} viewBox="0 0 22 22">
                <Path
                  d="M13.5 4.5 L7 11 L13.5 17.5"
                  stroke={C.text}
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </Pressable>
          )}
          {title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
}

/** El título grande de las pantallas principales ("MY GAMES", "LISTS"…). */
export function ScreenTitle({ children }: { children: string }) {
  return <Text style={styles.heading}>{children}</Text>;
}

const styles = StyleSheet.create({
  bar: { backgroundColor: C.background },
  inner: {
    height: Layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.gutter,
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexShrink: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  back: { marginLeft: -Spacing.one, paddingVertical: Spacing.one },
  title: { fontFamily: Type.mono, fontSize: 12, color: C.text, letterSpacing: 2 },
  heading: {
    fontFamily: Type.dot,
    fontSize: 44,
    lineHeight: 50,
    color: C.text,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
});
