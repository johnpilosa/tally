import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Milestone } from '@/animations/config';
import { Colors, Type } from '@/constants/theme';

/**
 * El festejo de un milestone: pixeles que salen disparados desde el borde del botón y un letrero
 * abajo. Se pone encima del botón (mismo tamaño) y avisa con `onDone` cuando termina.
 * Todos los valores se ajustan en `Milestone`, en animations/config.ts.
 */
export function MilestoneBurst({
  value,
  big,
  size,
  onDone,
}: {
  value: number;
  big: boolean;
  /** Diámetro del botón. */
  size: number;
  onDone: () => void;
}) {
  const t = useSharedValue(0);
  const label = useSharedValue(0);

  const count = big ? Milestone.bigParticles : Milestone.particles;
  const distance = big ? Milestone.bigDistance : Milestone.distance;
  const text = (big ? Milestone.bigLabel : Milestone.label).replace('{n}', String(value));

  useEffect(() => {
    t.set(withTiming(1, { duration: Milestone.duration, easing: Milestone.easing }));
    const fade = Milestone.labelDuration * 0.2;
    label.set(
      withSequence(
        withTiming(1, { duration: fade }),
        withDelay(Milestone.labelDuration - fade * 2, withTiming(2, { duration: fade })),
      ),
    );
    const timer = setTimeout(onDone, Math.max(Milestone.duration, Milestone.labelDuration));
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El letrero: 0 → 1 aparece subiendo, 1 → 2 se desvanece.
  const labelStyle = useAnimatedStyle(() => {
    const v = label.get();
    return {
      opacity: v <= 1 ? v : 2 - v,
      transform: [{ translateY: (1 - Math.min(v, 1)) * 10 }],
    };
  });

  // Ángulos repartidos parejo, con un poco de azar para que no se vea tan perfecto; unos vuelan
  // más lejos que otros. Se calcula una sola vez para que no cambien si la pantalla se redibuja.
  const [pixels] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3,
      reach: 0.7 + Math.random() * 0.6,
    })),
  );

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
      {pixels.map((pixel, i) => (
        <Pixel
          key={i}
          t={t}
          angle={pixel.angle}
          from={size / 2}
          to={size / 2 + distance * pixel.reach}
          red={i % Milestone.redEvery === 0}
        />
      ))}
      <Animated.Text style={[styles.label, { top: size + 6 }, labelStyle]}>{text}</Animated.Text>
    </View>
  );
}

function Pixel({
  t,
  angle,
  from,
  to,
  red,
}: {
  t: SharedValue<number>;
  angle: number;
  from: number;
  to: number;
  red: boolean;
}) {
  const style = useAnimatedStyle(() => {
    const p = t.get();
    const r = from + (to - from) * p;
    return {
      opacity: 1 - p * p,
      transform: [
        { translateX: Math.cos(angle) * r },
        { translateY: Math.sin(angle) * r },
        { scale: 1 - 0.5 * p },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.pixel,
        { width: Milestone.pixelSize, height: Milestone.pixelSize },
        red && { backgroundColor: Colors.dark.accent },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  pixel: { position: 'absolute', backgroundColor: Colors.dark.text },
  label: {
    position: 'absolute',
    fontFamily: Type.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.dark.text,
  },
});
