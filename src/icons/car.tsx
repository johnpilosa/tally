import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { CarLap } from '@/animations/config';
import { Colors } from '@/constants/theme';

import { useOnTrigger, type IconProps } from './types';

const WHITE = Colors.dark.text;
const BLACK = Colors.dark.background;

/** Una rotonda vista desde arriba; el auto da la vuelta en cada toque (ver `CarLap`). */
export function CarIcon({ trigger, size }: IconProps) {
  // `rotation` es el ángulo actual; `target` es hacia dónde va. Se acumulan,
  // así que si tocas varias veces seguidas el auto suma vueltas en vez de saltar.
  const rotation = useSharedValue(0);
  const target = useSharedValue(0);

  useOnTrigger(trigger, () => {
    const sign = CarLap.direction === 'counterclockwise' ? -1 : 1;
    target.set(target.get() + sign * CarLap.degrees);
    rotation.set(withTiming(target.get(), { duration: CarLap.duration, easing: CarLap.easing }));
  });

  const carStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.get()}deg` }] }));

  return (
    <View style={{ width: size, height: size }}>
      <Road />
      <Animated.View style={[StyleSheet.absoluteFill, carStyle]}>
        <Car />
      </Animated.View>
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
