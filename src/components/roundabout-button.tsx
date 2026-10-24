import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { CarLap, RingPulse } from '@/animations/config';
import { BouncePressable } from '@/components/bounce-pressable';
import { Colors } from '@/constants/theme';

const WHITE = Colors.dark.text;
const BLACK = Colors.dark.background;

/**
 * El botón principal: un círculo blanco delgado con una rotonda vista desde arriba.
 * Cada toque hace que el auto dé la vuelta a la rotonda (ver `CarLap` en animations/config.ts).
 */
export function RoundaboutButton({
  onPress,
  size = 240,
  accessibilityLabel,
}: {
  onPress: () => void;
  size?: number;
  accessibilityLabel?: string;
}) {
  // `rotation` es el ángulo actual del auto; `target` es hacia dónde va. Se acumulan,
  // así que si tocas varias veces seguidas el auto suma vueltas en vez de saltar.
  const rotation = useSharedValue(0);
  const target = useSharedValue(0);
  const [pulses, setPulses] = useState<number[]>([]);

  const carStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.get()}deg` }] }));

  const handlePress = () => {
    const sign = CarLap.direction === 'counterclockwise' ? -1 : 1;
    target.set(target.get() + sign * CarLap.degrees);
    rotation.set(withTiming(target.get(), { duration: CarLap.duration, easing: CarLap.easing }));
    setPulses((p) => [...p, Date.now() + Math.random()]);
    onPress();
  };

  const inner = size * 0.72;

  return (
    <View style={{ width: size, height: size }}>
      {pulses.map((id) => (
        <Pulse key={id} size={size} onDone={() => setPulses((p) => p.filter((x) => x !== id))} />
      ))}
      <BouncePressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        <View style={{ width: inner, height: inner }}>
          <Road />
          <Animated.View style={[StyleSheet.absoluteFill, carStyle]}>
            <Car />
          </Animated.View>
        </View>
      </BouncePressable>
    </View>
  );
}

/*
 * Los dibujos usan un lienzo de 100×100 con el centro de la rotonda en (50, 50).
 * - Borde exterior de la calle: radio 38 (con una abertura abajo para la calle de entrada).
 * - Línea punteada del carril: radio 28. El auto anda sobre esta línea.
 * - Isla central: radio 16.
 */

function Road() {
  return (
    <Svg viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
      {/* Borde exterior: arco que deja libre la abertura de la calle de entrada (x de 44 a 56). */}
      <Path d="M44 87.52 A38 38 0 1 1 56 87.52" stroke={WHITE} strokeWidth={1} fill="none" />
      {/* Calle de entrada, abajo. */}
      <Path d="M44 87.52 L44 100 M56 87.52 L56 100" stroke={WHITE} strokeWidth={1} />
      {/* Carril, punteado. */}
      <Circle
        cx={50}
        cy={50}
        r={28}
        stroke={WHITE}
        strokeOpacity={0.35}
        strokeWidth={0.8}
        strokeDasharray="2 3"
        fill="none"
      />
      {/* Isla central. */}
      <Circle cx={50} cy={50} r={16} stroke={WHITE} strokeWidth={1} fill="none" />
      <Circle cx={50} cy={50} r={1.5} fill={Colors.dark.accent} />
    </Svg>
  );
}

/** El auto, visto desde arriba, parado abajo en el carril y mirando a la derecha (sentido antihorario). */
function Car() {
  return (
    <Svg viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
      {/* Carrocería */}
      <Rect x={43} y={74.5} width={14} height={7} rx={2.2} fill={WHITE} />
      {/* Parabrisas (adelante, a la derecha) */}
      <Rect x={51.5} y={75.6} width={2.6} height={4.8} rx={0.8} fill={BLACK} />
      {/* Vidrio trasero */}
      <Rect x={44.6} y={75.9} width={1.6} height={4.2} rx={0.6} fill={BLACK} />
    </Svg>
  );
}

/** Un anillo fino que se expande y desaparece (ver `RingPulse` en animations/config.ts). */
function Pulse({ size, onDone }: { size: number; onDone: () => void }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(withTiming(1, { duration: RingPulse.duration, easing: RingPulse.easing }));
    const timer = setTimeout(onDone, RingPulse.duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: RingPulse.startOpacity * (1 - t.get()),
    transform: [{ scale: 1 + (RingPulse.maxScale - 1) * t.get() }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pulse, { width: size, height: size, borderRadius: size / 2 }, style]}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: 1.5,
    borderColor: WHITE,
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: { position: 'absolute', borderWidth: 1, borderColor: WHITE },
});
