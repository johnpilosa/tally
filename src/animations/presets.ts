/**
 * Animaciones de entrada listas para usar en `entering={...}`. Todos los números salen de
 * `Overlay` en config.ts, así que se ajustan desde allá.
 */
import { Easing, Keyframe } from 'react-native-reanimated';

import { Overlay } from '@/animations/config';

/** Curva que arranca rápido y llega muy suave, como si flotara hasta su lugar. */
const dreamy = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Aparece subiendo un poco, creciendo apenas y desvaneciéndose hacia visible.
 * `direction: -1` hace que baje desde arriba (para menús que cuelgan de un botón).
 * `index` suma un retraso para que los elementos de una lista entren en cascada.
 */
export function floatIn({ direction = 1, index = 0 }: { direction?: 1 | -1; index?: number } = {}) {
  const { duration, rise, fromScale, stagger } = Overlay.enter;
  return new Keyframe({
    0: {
      opacity: 0,
      transform: [{ translateY: rise * direction }, { scale: fromScale }],
    },
    100: {
      opacity: 1,
      transform: [{ translateY: 0 }, { scale: 1 }],
      easing: dreamy,
    },
  })
    .duration(duration)
    .delay(index * stagger);
}
