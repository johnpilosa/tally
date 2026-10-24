import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Nerd } from '@/animations/config';
import { Colors } from '@/constants/theme';

import { useOnTrigger, type IconProps } from './types';

const WHITE = Colors.dark.text;
const BLACK = Colors.dark.background;

/*
 * Cara de nerd en líneas, sobre un lienzo de 100×100:
 * - Cara: círculo de radio 38 en el centro.
 * - Ojos y lentes centrados en (37, 46) y (63, 46).
 * - Boca con dos dientes de conejo abajo.
 * Cada parte que se mueve es una capa aparte: cara, ojos y lentes.
 */

/** El nerd se acomoda los lentes, pestañea y ladea la cabeza (ver `Nerd`). */
export function NerdIcon({ trigger, size }: IconProps) {
  const lift = useSharedValue(0);
  const blink = useSharedValue(1);
  const tilt = useSharedValue(0);

  useOnTrigger(trigger, () => {
    lift.set(
      withSequence(
        withTiming(-Nerd.glassesLift, { duration: Nerd.glassesUpDuration }),
        withSpring(0, Nerd.glassesSettle),
      ),
    );
    blink.set(
      withDelay(
        Nerd.blinkDelay,
        withSequence(
          withTiming(0.1, { duration: Nerd.blinkClose }),
          withTiming(1, { duration: Nerd.blinkOpen }),
        ),
      ),
    );
    tilt.set(
      withSequence(
        withTiming(Nerd.tilt, { duration: Nerd.tiltDuration }),
        withSpring(0, Nerd.tiltSettle),
      ),
    );
  });

  // El lienzo mide 100, pero en pantalla mide `size`: convertimos los puntos del dibujo.
  const scale = size / 100;
  const headStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt.get()}deg` }] }));
  const glassesStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.get() * scale }],
  }));
  const eyesStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.get() }] }));

  return (
    <Animated.View style={[{ width: size, height: size }, headStyle]}>
      <Face />
      <Animated.View style={[StyleSheet.absoluteFill, styles.eyesOrigin, eyesStyle]}>
        <Eyes />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, glassesStyle]}>
        <Glasses />
      </Animated.View>
    </Animated.View>
  );
}

function Face() {
  return (
    <Svg viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
      <Circle cx={50} cy={50} r={38} stroke={WHITE} strokeWidth={1.5} fill="none" />
      {/* Sonrisa */}
      <Path d="M36 66 Q50 76 64 66" stroke={WHITE} strokeWidth={1.5} fill="none" />
      {/* Dientes de conejo */}
      <Rect
        x={45.5}
        y={70}
        width={4.5}
        height={5.5}
        rx={0.6}
        stroke={WHITE}
        strokeWidth={1.2}
        fill={BLACK}
      />
      <Rect
        x={50}
        y={70}
        width={4.5}
        height={5.5}
        rx={0.6}
        stroke={WHITE}
        strokeWidth={1.2}
        fill={BLACK}
      />
    </Svg>
  );
}

function Eyes() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
        <Circle cx={37} cy={46} r={3} fill={WHITE} />
        <Circle cx={63} cy={46} r={3} fill={WHITE} />
      </Svg>
    </View>
  );
}

function Glasses() {
  return (
    <Svg viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
      {/* Marcos gruesos */}
      <Circle cx={37} cy={46} r={10} stroke={WHITE} strokeWidth={2.6} fill="none" />
      <Circle cx={63} cy={46} r={10} stroke={WHITE} strokeWidth={2.6} fill="none" />
      {/* Puente */}
      <Path d="M47 46 Q50 42.5 53 46" stroke={WHITE} strokeWidth={2.2} fill="none" />
      {/* Patillas hacia las orejas */}
      <Path d="M27 45 L13 41 M73 45 L87 41" stroke={WHITE} strokeWidth={2} />
      {/* Brillo en el lente, en rojo */}
      <Path d="M58 41 L61 38" stroke={Colors.dark.accent} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  // Los ojos pestañean cerrándose hacia su propio centro (46% de la altura), no el de la cara.
  eyesOrigin: { transformOrigin: '50% 46%' },
});
