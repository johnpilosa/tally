/**
 * Animaciones de entrada listas para usar en `entering={...}`. Todos los números salen de
 * `Overlay` en config.ts, así que se ajustan desde allá.
 *
 * Detalle técnico: en la versión web, Reanimated ignora la curva (`easing`) de los Keyframes y
 * mueve todo a velocidad constante, lo que se siente tieso. Por eso la curva se "dibuja" a mano
 * con varios pasos intermedios: así se ve igual de ágil en el navegador y en el celular.
 */
import { Keyframe } from 'react-native-reanimated';

import { Overlay } from '@/animations/config';

type KeyframeProps = ConstructorParameters<typeof Keyframe>[0];

/** Curva cubic-bezier(x1, y1, x2, y2), como en CSS: devuelve el avance (0 a 1) para un tiempo t. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  return (time: number) => {
    // Busca el punto de la curva cuyo x es `time` (por bisección) y devuelve su y.
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (at(x1, x2, mid) < time) lo = mid;
      else hi = mid;
    }
    return at(y1, y2, (lo + hi) / 2);
  };
}

/** Sale rápido y frena limpio, sin colita larga: se siente ágil pero no brusco. */
const snappy = cubicBezier(0.2, 0.8, 0.2, 1);

/** Los momentos (en %) donde se calcula la curva. Más pasos = más suave. */
const STEPS = [0, 8, 16, 25, 35, 45, 55, 65, 75, 85, 100];

type Pose = { opacity: number; translateY: number; scale: number };

/** Arma un Keyframe que va de `from` a la pose de reposo siguiendo la curva `snappy`. */
function easedKeyframe(from: Pose) {
  const frames: Record<number, unknown> = {};
  for (const step of STEPS) {
    const p = snappy(step / 100);
    frames[step] = {
      opacity: from.opacity + (1 - from.opacity) * p,
      transform: [
        { translateY: from.translateY * (1 - p) },
        { scale: from.scale + (1 - from.scale) * p },
      ],
    };
  }
  return new Keyframe(frames as KeyframeProps);
}

/**
 * Aparece deslizándose un poco y creciendo apenas, mientras se hace visible.
 * `direction: -1` hace que baje desde arriba (para menús que cuelgan de un botón).
 * `index` suma un pequeño retraso para que las opciones de un menú entren en cascada;
 * `stagger` cambia cuánto se espera entre una y otra.
 */
export function popIn({
  direction = 1,
  index = 0,
  stagger = Overlay.enter.stagger,
}: { direction?: 1 | -1; index?: number; stagger?: number } = {}) {
  const { duration, rise, fromScale } = Overlay.enter;
  return easedKeyframe({ opacity: 0, translateY: rise * direction, scale: fromScale })
    .duration(duration)
    .delay(index * stagger);
}

/**
 * Para menús que se despliegan como una escalera: la opción `index` arranca escondida detrás de
 * la anterior (`step` puntos más arriba, el alto de una opción más el espacio entre ellas) y
 * baja hasta su lugar. La primera sale desde detrás del botón que abrió el menú.
 */
export function ladderIn({ index, step }: { index: number; step: number }) {
  const { duration, stagger } = Overlay.ladder;
  return easedKeyframe({ opacity: 0, translateY: -step, scale: 1 })
    .duration(duration)
    .delay(index * stagger);
}
