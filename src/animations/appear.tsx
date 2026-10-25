/**
 * <Appear>: cómo aparece todo en la app. Se desvanece de transparente a visible mientras sube
 * un poco desde abajo hasta su lugar, rápido y frenando limpio. Nunca crece ni hace zoom.
 * Todos los números salen de `Overlay` en config.ts.
 *
 * Se usa en lugar de `<Animated.View entering={...}>`: en la versión web, las animaciones de
 * entrada de Reanimated dejan los elementos con posición "absoluta" y desordenan la pantalla
 * (los menús se iban para arriba). Esta versión anima solo opacidad y desplazamiento, así que
 * el elemento nunca pierde su lugar.
 */
import { useEffect, type ComponentProps } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Overlay } from '@/animations/config';

/** Sale rápido y frena limpio, sin colita larga: se siente ágil pero no brusco. */
const snappy = Easing.bezier(0.2, 0.8, 0.2, 1);

export type AppearOptions = {
  /** Posición en una lista: cada una espera un poco más que la anterior (efecto cascada). */
  index?: number;
  /** 1 = sube desde abajo (normal). -1 = baja desde arriba (menús que cuelgan de un botón). */
  direction?: 1 | -1;
  /** Cuántos puntos se desplaza. Por defecto, `Overlay.enter.rise`. */
  distance?: number;
  /** Milisegundos entre un elemento y el siguiente. Por defecto, `Overlay.enter.stagger`. */
  stagger?: number;
  /** Cuánto dura. Por defecto, `Overlay.enter.duration`. */
  duration?: number;
};

export function Appear({
  options = {},
  style,
  ...rest
}: ComponentProps<typeof Animated.View> & { options?: AppearOptions }) {
  const {
    index = 0,
    direction = 1,
    distance = Overlay.enter.rise,
    stagger = Overlay.enter.stagger,
    duration = Overlay.enter.duration,
  } = options;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withDelay(index * stagger, withTiming(1, { duration, easing: snappy })));
    // Solo al aparecer: para repetirla, la pantalla vuelve a montar el contenido (useFocusKey).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: distance * direction * (1 - progress.get()) }],
  }));

  return <Animated.View {...rest} style={[style, animated]} />;
}
