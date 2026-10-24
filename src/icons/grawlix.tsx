import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Grawlix } from '@/animations/config';
import { Colors, Type } from '@/constants/theme';

import { useOnTrigger, type IconProps } from './types';

/** "#$%&!": símbolos de insulto de cómic que saltan como ola y el grupo tiembla (ver `Grawlix`). */
export function GrawlixIcon({ trigger, size }: IconProps) {
  const chars = Grawlix.text.split('');
  const shakeX = useSharedValue(0);

  useOnTrigger(trigger, () => {
    const { distance, times, stepDuration } = Grawlix.shake;
    const steps = [];
    for (let i = 0; i < times; i++) {
      steps.push(withTiming(distance, { duration: stepDuration }));
      steps.push(withTiming(-distance, { duration: stepDuration }));
    }
    steps.push(withTiming(0, { duration: stepDuration }));
    shakeX.set(withSequence(...steps));
  });

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.get() }] }));

  // El tamaño de letra se ajusta para que todos los símbolos quepan en el círculo.
  const fontSize = Math.min(size / (chars.length * 0.7), size * 0.32);

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <Animated.View style={[styles.row, shakeStyle]}>
        {chars.map((char, i) => (
          <Char key={i} char={char} index={i} trigger={trigger} fontSize={fontSize} />
        ))}
      </Animated.View>
    </View>
  );
}

function Char({
  char,
  index,
  trigger,
  fontSize,
}: {
  char: string;
  index: number;
  trigger: number;
  fontSize: number;
}) {
  const y = useSharedValue(0);
  const tilt = useSharedValue(0);

  useOnTrigger(trigger, () => {
    const delay = index * Grawlix.stagger;
    const up = { duration: Grawlix.riseDuration };
    const jump = Grawlix.jump * (0.6 + Math.random() * 0.8);
    const angle = (Math.random() * 2 - 1) * Grawlix.maxTilt;
    y.set(withDelay(delay, withSequence(withTiming(-jump, up), withSpring(0, Grawlix.land))));
    tilt.set(withDelay(delay, withSequence(withTiming(angle, up), withSpring(0, Grawlix.land))));
  });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.get() }, { rotate: `${tilt.get()}deg` }],
  }));

  return (
    <Animated.Text
      style={[
        styles.char,
        { fontSize, lineHeight: fontSize * 1.2 },
        index === Grawlix.redIndex && { color: Colors.dark.accent },
        style,
      ]}>
      {char}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row' },
  char: { fontFamily: Type.dot, color: Colors.dark.text },
});
