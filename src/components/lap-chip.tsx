import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { ChipLap } from '@/animations/config';
import { Colors, Spacing } from '@/constants/theme';

const C = Colors.dark;

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
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / ChipLap.duration);
      const value = from + (to - from) * easeOut(t);
      current.current = value;
      setProgress(value);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
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

  const inset = ChipLap.strokeWidth / 2;
  const w = Math.max(0, size.width - ChipLap.strokeWidth);
  const h = Math.max(0, size.height - ChipLap.strokeWidth);
  const r = h / 2;
  // Largo total del contorno de una pastilla: dos rectas arriba y abajo, y dos medias vueltas.
  const perimeter = 2 * Math.max(0, w - 2 * r) + 2 * Math.PI * r;
  // Al activarse, el trazo "crece" (0 → completo). Al desactivarse, la cola lo persigue y se va.
  const offset = active ? perimeter * (1 - progress) : -perimeter * (1 - progress);

  return (
    <Pressable onPress={onPress} onLayout={onLayout} style={styles.chip}>
      {size.width > 0 && progress > 0.001 && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
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
});
