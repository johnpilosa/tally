import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Hunt } from '@/animations/config';
import { Colors, Type } from '@/constants/theme';

const C = Colors.dark;

/**
 * Una tarjeta que se arrastra con el dedo: si la sueltas lejos, sale volando hacia ese lado y
 * avisa con `onSwipe(1)` (derecha) u `onSwipe(-1)` (izquierda); si no, vuelve a su lugar. Un toque
 * llama a `onTap`. `fling` la lanza sin arrastrarla (para los botones): cambia `fling.n` para
 * lanzarla hacia `fling.dir`.
 *
 * Cada tarjeta lleva su propia posición, así la siguiente aparece en su lugar sin saltos.
 */
export function SwipeCard({
  width,
  onSwipe,
  onTap,
  fling,
  rightLabel,
  leftLabel,
  children,
}: {
  width: number;
  onSwipe: (dir: 1 | -1) => void;
  onTap?: () => void;
  fling?: { dir: 1 | -1; n: number };
  /** El sello que aparece al arrastrar hacia la derecha / izquierda (opcional). */
  rightLabel?: string;
  leftLabel?: string;
  children: ReactNode;
}) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const threshold = width * Hunt.swipeThreshold;

  const flyOut = (dir: 1 | -1) => {
    'worklet';
    x.set(
      withTiming(dir * width * 1.6, { duration: Hunt.flyOut }, (done) => {
        if (done) runOnJS(onSwipe)(dir);
      }),
    );
  };

  // Solo cuando `fling.n` cambia después de aparecer: la tarjeta nueva no sale volando sola.
  const seen = useRef(fling?.n);
  useEffect(() => {
    if (!fling || fling.n === seen.current) return;
    seen.current = fling.n;
    flyOut(fling.dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fling?.n]);

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onUpdate((e) => {
      x.set(e.translationX);
      y.set(e.translationY * 0.3);
    })
    .onEnd((e) => {
      const far = Math.abs(x.get()) > threshold || Math.abs(e.velocityX) > 900;
      if (far) flyOut(x.get() > 0 || (x.get() === 0 && e.velocityX > 0) ? 1 : -1);
      else {
        x.set(withSpring(0, { damping: 16, stiffness: 220 }));
        y.set(withSpring(0, { damping: 16, stiffness: 220 }));
      }
    });
  const tap = Gesture.Tap().onEnd(() => {
    if (onTap) runOnJS(onTap)();
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { translateY: y.get() },
      { rotate: `${(x.get() / width) * Hunt.swipeTilt}deg` },
    ],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [0, threshold], [0, 1], 'clamp'),
  }));
  const leftStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [-threshold, 0], [1, 0], 'clamp'),
  }));

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <Animated.View style={cardStyle}>
        {children}
        {rightLabel && (
          <Animated.View pointerEvents="none" style={[styles.stamp, styles.right, rightStyle]}>
            <Text style={[styles.stampText, { color: C.accent }]}>{rightLabel}</Text>
          </Animated.View>
        )}
        {leftLabel && (
          <Animated.View pointerEvents="none" style={[styles.stamp, styles.left, leftStyle]}>
            <Text style={styles.stampText}>{leftLabel}</Text>
          </Animated.View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  stamp: {
    position: 'absolute',
    top: 28,
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: C.background,
  },
  right: { left: 24, borderColor: C.accent, transform: [{ rotate: '-12deg' }] },
  left: { right: 24, borderColor: C.text, transform: [{ rotate: '12deg' }] },
  stampText: { fontFamily: Type.dot, fontSize: 30, color: C.text, letterSpacing: 2 },
});
