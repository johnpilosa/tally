import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { BouncePressable } from '@/components/bounce-pressable';
import { Colors } from '@/constants/theme';

/** Las 10 puntas (5 de afuera y 5 de adentro) de una estrella en un cuadro de 24 × 24. */
const POINTS = Array.from({ length: 11 }, (_, i) => {
  const r = i % 2 === 0 ? 11 : 4.6;
  const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
  return `${12 + r * Math.cos(a)},${12.6 + r * Math.sin(a)}`;
});
/** La estrella entera. */
const STAR = POINTS.slice(0, 10).join(' ');
/** Su mitad izquierda: de la punta de abajo del centro, por la izquierda, hasta la de arriba. */
const HALF_STAR = POINTS.slice(5).join(' ');

/** Una estrella vacía, por la mitad o llena, según `value` desde la posición `n`. */
function StarIcon({
  n,
  value,
  size,
  color,
}: {
  n: number;
  value: number | undefined;
  size: number;
  color: string;
}) {
  const v = value ?? 0;
  const full = v >= n;
  const half = !full && v >= n - 0.5;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon
        points={STAR}
        fill={full ? color : 'none'}
        stroke={full || half ? color : Colors.dark.textSecondary}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {half && <Polygon points={HALF_STAR} fill={color} />}
    </Svg>
  );
}

/**
 * Cinco estrellas para puntuar de 0,5 a 5: tocar la mitad izquierda de una estrella marca
 * media, la derecha la marca entera. Tocar de nuevo el mismo puntaje lo borra.
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
  // Dónde se apoyó el dedo dentro de la estrella; se toma al tocar, antes de que se achique.
  const touchX = useRef(size);

  return (
    <View style={styles.row} accessibilityRole="adjustable" accessibilityLabel={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <BouncePressable
          key={n}
          hitSlop={4}
          pressedScale={0.8}
          accessibilityLabel={`${label} ${n}`}
          onPressIn={(e) => (touchX.current = e.nativeEvent.locationX)}
          onPress={() => {
            const next = touchX.current < size / 2 ? n - 0.5 : n;
            onChange(value === next ? undefined : next);
          }}>
          <StarIcon n={n} value={value} size={size} color={color} />
        </BouncePressable>
      ))}
    </View>
  );
}

/** Las mismas cinco estrellas, solo para mostrar (sin tocar), por ejemplo en la imagen de la reseña. */
export function Stars({
  value,
  size = 16,
  color = Colors.dark.text,
}: {
  value: number | undefined;
  size?: number;
  color?: string;
}) {
  return (
    <View style={[styles.row, { gap: size / 4 }]}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} n={n} value={value} size={size} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
});
