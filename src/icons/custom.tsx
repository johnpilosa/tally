import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Polygon, Rect } from 'react-native-svg';

import { CustomMotion } from '@/animations/config';
import { Colors } from '@/constants/theme';
import type { CustomIcon, Shape, ShapeKind } from '@/lib/custom-icons';

import { useOnTrigger, type IconProps } from './types';

/**
 * Dibuja un ícono hecho en el editor: cada forma en su lugar, y en cada toque cada una hace
 * su movimiento una vez (ver `CustomMotion` en animations/config.ts).
 */
export function CustomIconView({
  icon,
  trigger,
  size,
  selectedId,
}: IconProps & {
  icon: CustomIcon;
  /** En el editor: la forma elegida se marca con un recuadro rojo. */
  selectedId?: string | null;
}) {
  return (
    <View style={{ width: size, height: size }}>
      {icon.shapes.map((shape) => (
        <ShapeView
          key={shape.id}
          shape={shape}
          trigger={trigger}
          canvas={size}
          selected={shape.id === selectedId}
        />
      ))}
    </View>
  );
}

/** El lienzo mide 100 × 100; `canvas` es cuánto mide en pantalla. */
function ShapeView({
  shape,
  trigger,
  canvas,
  selected,
}: {
  shape: Shape;
  trigger: number;
  canvas: number;
  selected: boolean;
}) {
  // 0 = quieta, va hasta 1 durante el movimiento. En 0 y en 1 la forma está en su posición base.
  const progress = useSharedValue(0);

  useOnTrigger(trigger, () => {
    if (shape.motion === 'none') return;
    const duration = CustomMotion[shape.motion].duration / shape.speed;
    progress.set(0);
    progress.set(withDelay(shape.delay, withTiming(1, { duration, easing: CustomMotion.easing })));
  });

  const scale = canvas / 100;
  const { motion, rotation } = shape;
  // Solo números para el hilo de animaciones.
  const m = {
    turns: CustomMotion.spin.turns,
    grow: CustomMotion.pulse.grow,
    floatHeight: CustomMotion.float.height,
    orbitRadius: CustomMotion.orbit.radius,
    shakeDistance: CustomMotion.shake.distance,
    shakeTimes: CustomMotion.shake.times,
    bounceHeight: CustomMotion.bounce.height,
  };

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    let x = 0;
    let y = 0;
    let turn = 0;
    let grow = 1;
    let opacity = 1;
    if (motion === 'spin') turn = 360 * m.turns * p;
    if (motion === 'pulse') grow = 1 + m.grow * Math.sin(Math.PI * p);
    if (motion === 'float') y = -m.floatHeight * Math.sin(Math.PI * p);
    if (motion === 'blink') opacity = 1 - Math.sin(Math.PI * p);
    if (motion === 'orbit') {
      x = m.orbitRadius * Math.sin(2 * Math.PI * p);
      y = m.orbitRadius * (Math.cos(2 * Math.PI * p) - 1);
    }
    if (motion === 'shake')
      x = m.shakeDistance * Math.sin(m.shakeTimes * 2 * Math.PI * p) * (1 - p);
    if (motion === 'bounce') y = -m.bounceHeight * 4 * p * (1 - p);
    return {
      opacity,
      transform: [
        { translateX: x * scale },
        { translateY: y * scale },
        { rotate: `${rotation + turn}deg` },
        { scale: grow },
      ],
    };
  });

  const px = shape.size * scale;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: (shape.x - shape.size / 2) * scale,
          top: (shape.y - shape.size / 2) * scale,
          width: px,
          height: px,
        },
        style,
      ]}>
      <ShapeSvg kind={shape.kind} filled={shape.filled} color={shape.color} pixels={px} />
      {selected && (
        <View
          style={{
            position: 'absolute',
            inset: -4,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: Colors.dark.accent,
          }}
        />
      )}
    </Animated.View>
  );
}

/** Los puntos de una estrella de 5 puntas en el cuadro de 100 × 100. */
const STAR = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 === 0 ? 47 : 19;
  const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
  return `${50 + r * Math.cos(a)},${53 + r * Math.sin(a)}`;
}).join(' ');

export function ShapeSvg({
  kind,
  filled,
  color,
  pixels,
}: {
  kind: ShapeKind;
  filled: boolean;
  color: 'white' | 'red';
  /** Cuánto mide en pantalla, para que la línea se vea siempre del mismo grosor. */
  pixels: number;
}) {
  const stroke = color === 'red' ? Colors.dark.accent : Colors.dark.text;
  const strokeWidth = (1.5 * 100) / Math.max(pixels, 1);
  const common = {
    stroke,
    strokeWidth,
    strokeLinejoin: 'round' as const,
    fill: filled ? stroke : 'none',
  };
  return (
    <Svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      {kind === 'circle' && <Circle cx={50} cy={50} r={48} {...common} />}
      {kind === 'square' && <Rect x={2} y={2} width={96} height={96} {...common} />}
      {kind === 'triangle' && <Polygon points="50,4 97,95 3,95" {...common} />}
      {kind === 'star' && <Polygon points={STAR} {...common} />}
      {kind === 'line' && (
        <Line x1={0} y1={50} x2={100} y2={50} stroke={stroke} strokeWidth={strokeWidth * 1.5} />
      )}
    </Svg>
  );
}
