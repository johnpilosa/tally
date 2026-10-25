import { StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { BouncePressable } from '@/components/bounce-pressable';
import { Colors } from '@/constants/theme';

/** Una estrella de 5 puntas en un cuadro de 24 × 24. */
const STAR = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 === 0 ? 11 : 4.6;
  const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
  return `${12 + r * Math.cos(a)},${12.6 + r * Math.sin(a)}`;
}).join(' ');

/**
 * Cinco estrellas para puntuar de 1 a 5. Tocar la estrella que ya está marcada como la última
 * borra el puntaje.
 */
export function StarRating({
  value,
  onChange,
  size = 22,
  color = Colors.dark.text,
  label,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  size?: number;
  color?: string;
  label: string;
}) {
  return (
    <View style={styles.row} accessibilityRole="adjustable" accessibilityLabel={label}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = (value ?? 0) >= n;
        return (
          <BouncePressable
            key={n}
            hitSlop={4}
            pressedScale={0.8}
            accessibilityLabel={`${label} ${n}`}
            onPress={() => onChange(value === n ? undefined : n)}>
            <Svg width={size} height={size} viewBox="0 0 24 24">
              <Polygon
                points={STAR}
                fill={on ? color : 'none'}
                stroke={on ? color : Colors.dark.textSecondary}
                strokeWidth={1.2}
                strokeLinejoin="round"
              />
            </Svg>
          </BouncePressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
});
