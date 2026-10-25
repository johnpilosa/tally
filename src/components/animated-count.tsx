import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CountChange } from '@/animations/config';
import { useTheme } from '@/hooks/use-theme';

/** Sale rápido y frena limpio, sin pasarse ni rebotar (la misma curva que `<Appear>`). */
const snappy = Easing.bezier(0.2, 0.8, 0.2, 1);

/**
 * Un número que, al cambiar, entra desde abajo si subió y desde arriba si bajó.
 * No anima la primera vez que aparece en pantalla.
 *
 * Se anima a mano (sin `entering` de Reanimated): el resorte de esas animaciones rebotaba un
 * buen rato en el teléfono y en web ni se notaba; así se ve igual en los dos.
 */
export function AnimatedCount({ value, style }: { value: number; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  const [prev, setPrev] = useState(value);
  const [goingUp, setGoingUp] = useState(true);
  // Pasa a true con el primer cambio: el número que aparece al abrir la pantalla no se anima.
  const [changed, setChanged] = useState(false);
  if (value !== prev) {
    setGoingUp(value > prev);
    setPrev(value);
    setChanged(true);
  }

  return (
    <View style={styles.clip}>
      <Digit
        key={value}
        animate={changed}
        from={goingUp ? 1 : -1}
        style={[styles.text, { color: theme.text }, style]}>
        {value}
      </Digit>
    </View>
  );
}

function Digit({
  animate,
  from,
  style,
  children,
}: {
  animate: boolean;
  /** 1 = entra desde abajo, -1 = desde arriba. */
  from: 1 | -1;
  style: StyleProp<TextStyle>;
  children: number;
}) {
  const progress = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (animate) progress.set(withTiming(1, { duration: CountChange.duration, easing: snappy }));
    // Solo al aparecer: cada número nuevo es un componente nuevo (key={value}).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: from * CountChange.distance * (1 - progress.get()) }],
  }));

  return <Animated.Text style={[style, animated]}>{children}</Animated.Text>;
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  text: { fontVariant: ['tabular-nums'] },
});
