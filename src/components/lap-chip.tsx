import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { ChipLap } from '@/animations/config';
import { Colors, Spacing } from '@/constants/theme';

const C = Colors.dark;
/** Grosor del borde gris de la pastilla. */
const BORDER = 1;

/** Sale rápido y frena suave (como cubic-bezier(0.2, 0.8, 0.2, 1) en CSS, aproximado). */
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * Avanza de 0 a 1 (o de 1 a 0) cuadro a cuadro cuando cambia `on`. Se hace con
 * requestAnimationFrame para que el trazo del SVG se anime igual en web y en el celular.
 */
function useLap(on: boolean) {
  const [progress, setProgress] = useState(on ? 1 : 0);
  const current = useRef(on ? 1 : 0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const from = current.current;
    const to = on ? 1 : 0;
    let frame = 0;
    let start = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / ChipLap.duration);
      const value = from + (to - from) * easeOut(t);
      current.current = value;
      setProgress(value);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    // Al apagarse espera a que el nuevo filtro termine su vuelta, y recién ahí se va.
    const wait = setTimeout(
      () => {
        start = Date.now();
        frame = requestAnimationFrame(tick);
      },
      on ? 0 : ChipLap.leaveDelay,
    );
    return () => {
      clearTimeout(wait);
      cancelAnimationFrame(frame);
    };
  }, [on]);

  return progress;
}

/**
 * Un filtro con forma de pastilla. Cuando se activa, su contorno blanco se dibuja dando una
 * vuelta completa; cuando se desactiva, el contorno sigue avanzando y desaparece por detrás.
 */
export function LapChip({
  active,
  onPress,
  children,
}: {
  active: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const progress = useLap(active);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };

  // El trazo va justo encima del borde gris (que mide 1 punto), centrado en él.
  const inset = BORDER / 2;
  const w = Math.max(0, size.width - BORDER);
  const h = Math.max(0, size.height - BORDER);
  const r = h / 2;
  // Largo total del contorno de una pastilla: dos rectas arriba y abajo, y dos medias vueltas.
  // Se le suma un poquito para que, al cerrarse, no quede una rendija por redondeo.
  const perimeter = 2 * Math.max(0, w - 2 * r) + 2 * Math.PI * r + 2;
  // Al activarse, el trazo "crece" (0 → completo). Al desactivarse, la cola lo persigue y se va.
  const offset = active ? perimeter * (1 - progress) : -perimeter * (1 - progress);

  return (
    <Pressable onPress={onPress} onLayout={onLayout} style={styles.chip}>
      {size.width > 0 && progress > 0.001 && (
        <View pointerEvents="none" style={[styles.overlay, size]}>
          <Svg width={size.width} height={size.height}>
            <Rect
              x={inset}
              y={inset}
              width={w}
              height={h}
              rx={r}
              ry={r}
              fill="none"
              stroke={C.text}
              strokeWidth={ChipLap.strokeWidth}
              strokeDasharray={`${perimeter} ${perimeter}`}
              strokeDashoffset={offset}
            />
          </Svg>
        </View>
      )}
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Cubre la pastilla completa, borde incluido (por eso empieza 1 punto afuera).
  overlay: { position: 'absolute', top: -BORDER, left: -BORDER },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: BORDER,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
