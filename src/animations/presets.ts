/**
 * Animaciones de entrada listas para usar en `entering={...}`. Todos los números salen de
 * `Overlay` en config.ts, así que se ajustan desde allá.
 */
import { Easing, Keyframe } from 'react-native-reanimated';

import { Overlay } from '@/animations/config';

/** Sale rápido y frena limpio, sin colita larga: se siente ágil pero no brusco. */
const snappy = Easing.bezier(0.2, 0.8, 0.2, 1);

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
  return new Keyframe({
    0: {
      opacity: 0,
      transform: [{ translateY: rise * direction }, { scale: fromScale }],
    },
    100: {
      opacity: 1,
      transform: [{ translateY: 0 }, { scale: 1 }],
      easing: snappy,
    },
  })
    .duration(duration)
    .delay(index * stagger);
}
