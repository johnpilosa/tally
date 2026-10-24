import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, { FadeInDown, FadeInUp, LayoutAnimationConfig } from 'react-native-reanimated';

import { CountChange } from '@/animations/config';
import { useTheme } from '@/hooks/use-theme';

/**
 * Un número que, al cambiar, entra desde abajo si subió y desde arriba si bajó.
 * No anima la primera vez que aparece en pantalla.
 */
export function AnimatedCount({ value, style }: { value: number; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  const [prev, setPrev] = useState(value);
  const [goingUp, setGoingUp] = useState(true);
  if (value !== prev) {
    setGoingUp(value > prev);
    setPrev(value);
  }

  // Ojo con los nombres de Reanimated: FadeInDown entra desde abajo, FadeInUp desde arriba.
  const entering = (goingUp ? FadeInDown : FadeInUp)
    .springify()
    .damping(CountChange.damping)
    .stiffness(CountChange.stiffness);

  return (
    <View style={styles.clip}>
      <LayoutAnimationConfig skipEntering>
        <Animated.Text
          key={value}
          entering={entering}
          style={[styles.text, { color: theme.text }, style]}>
          {value}
        </Animated.Text>
      </LayoutAnimationConfig>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  text: { fontVariant: ['tabular-nums'] },
});
