import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { RingPulse } from '@/animations/config';
import { BouncePressable } from '@/components/bounce-pressable';
import { Colors } from '@/constants/theme';
import { Icons, type IconId } from '@/icons';

/**
 * El botón principal: un círculo blanco delgado con un ícono animado adentro.
 * Cada toque se hunde, suelta un anillo y le avisa al ícono para que haga su animación.
 */
export function CounterButton({
  icon = 'car',
  onPress,
  size = 240,
  accessibilityLabel,
}: {
  icon?: IconId;
  onPress: () => void;
  size?: number;
  accessibilityLabel?: string;
}) {
  const [trigger, setTrigger] = useState(0);
  const [pulses, setPulses] = useState<number[]>([]);
  const Icon = (Icons[icon] ?? Icons.car).Component;

  const handlePress = () => {
    setTrigger((t) => t + 1);
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
        <View style={[styles.iconBox, { width: inner, height: inner }]}>
          {/* `key` hace que al cambiar de ícono se monte uno nuevo, sin arrastrar animaciones. */}
          <Icon key={icon} trigger={trigger} size={inner} />
        </View>
      </BouncePressable>
    </View>
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
    borderColor: Colors.dark.text,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: { alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', borderWidth: 1, borderColor: Colors.dark.text },
});
