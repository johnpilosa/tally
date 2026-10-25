import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Path } from 'react-native-svg';

import { TitleTyping } from '@/animations/config';
import { registerTitle } from '@/animations/title-bus';
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

/**
 * El título grande de las pantallas principales ("MY GAMES", "LISTS"…). Se escribe letra por
 * letra cada vez que la pantalla aparece, y se borra letra por letra (desde la última) cuando
 * la navegación se lo pide al cambiar de pestaña. Velocidades en `TitleTyping` (config.ts).
 */
export function ScreenTitle({ children, rule }: { children: string; rule?: boolean }) {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      const stop = () => {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
      };
      // Avanza o retrocede una letra por vez hasta `to`, y al llegar llama a `done`.
      const run = (to: number, msPerChar: number, done?: () => void) => {
        stop();
        timer.current = setInterval(() => {
          const n = shownRef.current + (to > shownRef.current ? 1 : -1);
          shownRef.current = n;
          setShown(n);
          if (n === to) {
            stop();
            done?.();
          }
        }, msPerChar);
      };

      shownRef.current = 0;
      setShown(0);
      run(children.length, TitleTyping.typeMs);
      const unregister = registerTitle({
        erase: (done) => (shownRef.current === 0 ? done() : run(0, TitleTyping.eraseMs, done)),
      });
      return () => {
        unregister();
        stop();
      };
    }, [children]),
  );

  const heading = (
    <Text style={styles.heading} accessibilityLabel={children}>
      {/* El espacio invisible mantiene el alto de la línea mientras no hay letras. */}
      {children.slice(0, shown) || '\u200b'}
    </Text>
  );
  if (!rule) return heading;
  return (
    <View>
      {heading}
      {/* Línea punteada gris, medio transparente, debajo del título. */}
      <Svg width="100%" height={4} style={styles.rule}>
        <Line
          x1={2}
          y1={2}
          x2="100%"
          y2={2}
          stroke={C.textSecondary}
          strokeOpacity={0.5}
          strokeWidth={3}
          strokeDasharray="0.1 10"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
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
  rule: { marginBottom: Spacing.two },
});
