/**
 * TODAS LAS ANIMACIONES DE LA APP, EN UN SOLO LUGAR.
 *
 * Cambia un número, guarda, y lo ves al instante en la app.
 *
 * Dos tipos de animación:
 * - "timing": dura exactamente `duration` milisegundos (1000 = 1 segundo) y sigue una curva `easing`.
 * - "spring" (resorte): no tiene duración fija; se siente física.
 *     damping   → freno. Bajo (5) = rebota mucho. Alto (30) = casi no rebota.
 *     stiffness → fuerza. Alto (500) = rápido y seco. Bajo (100) = lento y blando.
 *
 * Curvas de easing útiles (de react-native-reanimated):
 *   Easing.linear                      velocidad constante
 *   Easing.inOut(Easing.cubic)         arranca suave, acelera, frena suave
 *   Easing.out(Easing.cubic)           arranca rápido y frena suave
 *   Easing.inOut(Easing.back(1.5))     se pasa un poquito y vuelve
 *   Easing.elastic(1)                  efecto elástico
 */
import { Easing } from 'react-native-reanimated';

/** El auto dando la vuelta en la rotonda cada vez que tocas el botón. */
export const CarLap = {
  /** Cuántos grados recorre por toque. 360 = vuelta completa; 180 = media vuelta. */
  degrees: 360,
  /** 'counterclockwise' = países que manejan por la derecha; 'clockwise' = por la izquierda (Reino Unido). */
  direction: 'counterclockwise' as 'clockwise' | 'counterclockwise',
  duration: 1100,
  easing: Easing.inOut(Easing.cubic),
};

/** El botón circular al presionarlo y soltarlo. */
export const ButtonPress = {
  /** Cuánto se achica al presionar (1 = nada, 0.9 = 10% más chico). */
  pressedScale: 0.96,
  press: { damping: 20, stiffness: 600 },
  release: { damping: 9, stiffness: 300 },
};

/** El anillo fino que se expande desde el botón al tocarlo. */
export const RingPulse = {
  duration: 700,
  /** Hasta qué tamaño crece (1.3 = 30% más grande que el botón). */
  maxScale: 1.3,
  /** Qué tan visible arranca (0 a 1). */
  startOpacity: 0.6,
  easing: Easing.out(Easing.cubic),
};

/** El número del contador al cambiar: entra desde abajo al sumar y desde arriba al deshacer. */
export const CountChange = {
  damping: 16,
  stiffness: 260,
};

/** Al cambiar de contador, cuánto tarda en aparecer el nuevo. */
export const SwitchTally = {
  duration: 250,
};
