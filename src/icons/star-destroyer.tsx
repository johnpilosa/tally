import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

import { StarDestroyer } from '@/animations/config';
import { Colors } from '@/constants/theme';

import { useOnTrigger, type IconProps } from './types';

const WHITE = Colors.dark.text;
const BLACK = Colors.dark.background;

/*
 * Destructor estelar visto desde arriba, sobre un lienzo de 100×100:
 * una cuña con la punta arriba en (50, 10) y la popa abajo, de x 20 a 80 en y 84.
 * Está dibujado en dos mitades (izquierda y derecha) para poder partirlo por el medio.
 */

/** La nave se parte en dos con un destello rojo, flota un momento y se vuelve a armar (ver `StarDestroyer`). */
export function StarDestroyerIcon({ trigger, size }: IconProps) {
  // 0 = nave entera, 1 = mitades separadas del todo.
  const apart = useSharedValue(0);
  const flash = useSharedValue(0);

  useOnTrigger(trigger, () => {
    apart.set(
      withSequence(
        withTiming(1, { duration: StarDestroyer.breakDuration, easing: StarDestroyer.breakEasing }),
        withDelay(StarDestroyer.hold, withSpring(0, StarDestroyer.rejoin)),
      ),
    );
    flash.set(0);
    flash.set(withTiming(1, { duration: StarDestroyer.flashDuration }));
  });

  const scale = size / 100;
  const half = (side: -1 | 1) => () => {
    'worklet';
    const t = apart.get();
    return {
      transform: [
        { translateX: side * StarDestroyer.split * scale * t },
        { translateY: StarDestroyer.drift * scale * t },
        { rotate: `${side * StarDestroyer.tilt * t}deg` },
      ],
    };
  };
  const leftStyle = useAnimatedStyle(half(-1));
  const rightStyle = useAnimatedStyle(half(1));
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.get() === 0 ? 0 : 1 - flash.get(),
    transform: [{ scale: flash.get() * StarDestroyer.flashMaxScale }],
  }));

  return (
    <Animated.View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, flashStyle]}>
        <Svg viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
          <Circle cx={50} cy={50} r={8} stroke={Colors.dark.accent} strokeWidth={1.5} fill="none" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.pivot, leftStyle]}>
        <Half side="left" />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.pivot, rightStyle]}>
        <Half side="right" />
      </Animated.View>
    </Animated.View>
  );
}

/** Una mitad de la nave. La derecha es la izquierda reflejada. */
function Half({ side }: { side: 'left' | 'right' }) {
  return (
    <Svg
      viewBox="0 0 100 100"
      style={[StyleSheet.absoluteFill, side === 'right' && { transform: [{ scaleX: -1 }] }]}>
      {/* Casco */}
      <Polygon
        points="50,10 50,84 20,84"
        stroke={WHITE}
        strokeWidth={1.4}
        strokeLinejoin="round"
        fill={BLACK}
      />
      {/* Líneas de paneles */}
      <Path d="M50 34 L38 76 M50 56 L30 80" stroke={WHITE} strokeOpacity={0.4} strokeWidth={0.8} />
      {/* Media torre de mando */}
      <Rect x={44} y={66} width={6} height={10} stroke={WHITE} strokeWidth={1.2} fill={BLACK} />
      <Rect x={41} y={64} width={9} height={3} stroke={WHITE} strokeWidth={1} fill={BLACK} />
      {/* Motor */}
      <Rect x={36} y={84} width={7} height={3} stroke={WHITE} strokeWidth={1} fill={BLACK} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  // Las mitades giran desde la popa (abajo al centro), como si se quebrara desde atrás.
  pivot: { transformOrigin: '50% 84%' },
});
