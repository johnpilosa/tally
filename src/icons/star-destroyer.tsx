import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Path, Polygon, Rect } from 'react-native-svg';

import { StarDestroyer } from '@/animations/config';
import { Colors } from '@/constants/theme';

import { useOnTrigger, type IconProps } from './types';

const WHITE = Colors.dark.text;
const BLACK = Colors.dark.background;

/*
 * Destructor estelar visto desde arriba, sobre un lienzo de 100×100:
 * una cuña con la punta arriba en (50, 10) y la popa abajo, de x 20 a 80 en y 84.
 *
 * La maniobra Holdo: un rayo baja por la línea x = `cutX`, saltan partículas desde el corte y
 * el pedazo de la izquierda sale girando. Después todo vuelve a su lugar.
 */

const { cutX } = StarDestroyer;
/** Dónde el corte entra al casco (el borde izquierdo de la cuña) y dónde sale (la popa). */
const CUT_TOP = 10 + ((50 - cutX) / 30) * 74;
const CUT_BOTTOM = 84;
/** El pedazo cortado gira desde el medio del corte. */
const PIVOT = `${cutX}% ${(CUT_TOP + CUT_BOTTOM) / 2}%`;

/** Números al azar pero siempre iguales para cada partícula, para que la explosión no cambie. */
const noise = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Dónde nace cada partícula sobre el corte, hacia dónde sale y cuánto se demora en salir. */
const PARTICLES = Array.from({ length: StarDestroyer.particles }, (_, i) => {
  // La mayoría sale hacia la izquierda, como esquirlas del pedazo cortado; algunas, al otro lado.
  const left = noise(i, 1) < 0.75;
  const spread = (noise(i, 2) - 0.5) * Math.PI * (left ? 1.1 : 0.9);
  const angle = (left ? Math.PI : 0) + spread;
  const distance = StarDestroyer.particleDistance * (0.35 + 0.65 * noise(i, 3));
  return {
    x: cutX,
    y: CUT_TOP + (CUT_BOTTOM - CUT_TOP) * noise(i, 4),
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance + 6 * noise(i, 5),
    size: 1 + 2 * noise(i, 6),
    delay: 0.25 * noise(i, 7),
  };
});

export function StarDestroyerIcon({ trigger, size }: IconProps) {
  // 0 = nave entera, 1 = pedazo cortado del todo afuera.
  const apart = useSharedValue(0);
  // El rayo: 0 = no está, 1 = cruzó la nave entera. `glow` es su brillo, que se apaga después.
  const beam = useSharedValue(0);
  const glow = useSharedValue(0);
  // Las partículas: de 0 (recién salen) a 1 (ya se apagaron).
  const burst = useSharedValue(0);
  const clipId = useId().replace(/[^a-zA-Z0-9]/g, '');

  useOnTrigger(trigger, () => {
    const hit = StarDestroyer.beamDuration * 0.5;
    beam.set(0);
    beam.set(
      withTiming(1, { duration: StarDestroyer.beamDuration, easing: Easing.in(Easing.quad) }),
    );
    glow.set(1);
    glow.set(
      withDelay(StarDestroyer.beamDuration, withTiming(0, { duration: StarDestroyer.beamFade })),
    );
    burst.set(0);
    burst.set(withDelay(hit, withTiming(1, { duration: StarDestroyer.particleDuration })));
    apart.set(
      withSequence(
        withDelay(
          hit,
          withTiming(1, {
            duration: StarDestroyer.breakDuration,
            easing: StarDestroyer.breakEasing,
          }),
        ),
        withDelay(StarDestroyer.hold, withSpring(0, StarDestroyer.rejoin)),
      ),
    );
  });

  const scale = size / 100;
  const pieceStyle = useAnimatedStyle(() => {
    const t = apart.get();
    return {
      transform: [
        { translateX: -StarDestroyer.split * scale * t },
        { translateY: StarDestroyer.drift * scale * t },
        { rotate: `${-StarDestroyer.tilt * t}deg` },
      ],
    };
  });
  const hullStyle = useAnimatedStyle(() => {
    const t = apart.get() * StarDestroyer.recoil;
    return {
      transform: [
        { translateX: StarDestroyer.split * scale * t },
        { rotate: `${StarDestroyer.tilt * 0.4 * t}deg` },
      ],
    };
  });
  // El borde del corte aparece apenas se separan, para que cada pedazo quede cerrado.
  const edgeStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, apart.get() * 6) }));
  // El rayo crece desde arriba, y se ve solo mientras brilla.
  const beamStyle = useAnimatedStyle(() => ({
    opacity: glow.get(),
    transform: [{ scaleY: beam.get() }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.hullPivot, hullStyle]}>
        <Ship clipId={`${clipId}r`} side="right" />
        <CutEdge style={edgeStyle} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: PIVOT }, pieceStyle]}>
        <Ship clipId={`${clipId}l`} side="left" />
        <CutEdge style={edgeStyle} />
      </Animated.View>

      {PARTICLES.map((p, i) => (
        <Particle key={i} particle={p} burst={burst} scale={scale} />
      ))}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.beam,
          { left: cutX * scale - 4, top: -size * 0.1, height: size * 1.2 },
          beamStyle,
        ]}>
        <View style={styles.beamGlow} />
        <View style={styles.beamCore} />
      </Animated.View>
    </View>
  );
}

/** La nave entera, recortada para mostrar solo un lado del corte. */
function Ship({ clipId, side }: { clipId: string; side: 'left' | 'right' }) {
  return (
    <Svg viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
      <Defs>
        <ClipPath id={clipId}>
          {side === 'left' ? (
            <Rect x={-50} y={-50} width={cutX + 50} height={200} />
          ) : (
            <Rect x={cutX} y={-50} width={150} height={200} />
          )}
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        {/* Casco */}
        <Polygon
          points="50,10 80,84 20,84"
          stroke={WHITE}
          strokeWidth={1.4}
          strokeLinejoin="round"
          fill={BLACK}
        />
        <Path d="M50 10 L50 84" stroke={WHITE} strokeWidth={1.4} />
        {/* Líneas de paneles */}
        <Path
          d="M50 34 L38 76 M50 56 L30 80 M50 34 L62 76 M50 56 L70 80"
          stroke={WHITE}
          strokeOpacity={0.4}
          strokeWidth={0.8}
        />
        {/* Torre de mando */}
        <Rect x={44} y={66} width={12} height={10} stroke={WHITE} strokeWidth={1.2} fill={BLACK} />
        <Rect x={41} y={64} width={18} height={3} stroke={WHITE} strokeWidth={1} fill={BLACK} />
        <Path d="M50 66 L50 76" stroke={WHITE} strokeWidth={1.2} />
        {/* Motores */}
        <Rect x={36} y={84} width={7} height={3} stroke={WHITE} strokeWidth={1} fill={BLACK} />
        <Rect x={57} y={84} width={7} height={3} stroke={WHITE} strokeWidth={1} fill={BLACK} />
      </G>
    </Svg>
  );
}

/** La línea del corte, que cierra cada pedazo mientras están separados. */
function CutEdge({ style }: { style: ReturnType<typeof useAnimatedStyle> }) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
        <Path
          d={`M${cutX} ${CUT_TOP} L${cutX} ${CUT_BOTTOM}`}
          stroke={WHITE}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}

/** Una esquirla: sale del corte frenando y se apaga. */
function Particle({
  particle: p,
  burst,
  scale,
}: {
  particle: (typeof PARTICLES)[number];
  burst: SharedValue<number>;
  scale: number;
}) {
  const style = useAnimatedStyle(() => {
    const local = Math.min(1, Math.max(0, (burst.get() - p.delay) / (1 - p.delay)));
    const eased = 1 - (1 - local) ** 3;
    return {
      opacity: local === 0 || local === 1 ? 0 : 1 - local,
      transform: [{ translateX: p.dx * scale * eased }, { translateY: p.dy * scale * eased }],
    };
  });
  const s = p.size * scale;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        { left: p.x * scale - s / 2, top: p.y * scale - s / 2, width: s, height: s },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  // El resto de la nave se mueve desde la popa, empujado por el golpe.
  hullPivot: { transformOrigin: '50% 84%' },
  beam: { position: 'absolute', width: 8, alignItems: 'center', transformOrigin: 'top' },
  beamGlow: {
    ...StyleSheet.absoluteFill,
    borderRadius: 4,
    backgroundColor: WHITE,
    opacity: 0.18,
  },
  beamCore: { width: 1.5, height: '100%', backgroundColor: WHITE },
  particle: { position: 'absolute', backgroundColor: WHITE },
});
