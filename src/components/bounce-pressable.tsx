import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ButtonPress } from '@/animations/config';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Cuánto se achica al presionar (1 = nada). Por defecto, el de `ButtonPress` en animations/config.ts. */
  pressedScale?: number;
};

/** Pressable que se hunde al presionar y rebota al soltar. */
export function BouncePressable({
  style,
  pressedScale = ButtonPress.pressedScale,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        scale.set(withSpring(pressedScale, ButtonPress.press));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, ButtonPress.release));
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
    />
  );
}
