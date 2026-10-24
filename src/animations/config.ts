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

/* ─────────────────────────── ÍCONOS ─────────────────────────── */

/** Los símbolos de insulto: cada uno salta y se ladea, uno detrás de otro, y el grupo tiembla. */
export const Grawlix = {
  /** Los símbolos que se muestran. Puedes poner los que quieras. */
  text: '#$%&!',
  /** Cuál de los símbolos va en rojo (0 = el primero). Pon -1 para ninguno. */
  redIndex: 4,
  /** Cuánto saltan, en puntos. Cada uno salta un poco distinto al azar. */
  jump: 22,
  /** Cuánto se ladean como máximo, en grados (al azar, para un lado u otro). */
  maxTilt: 30,
  /** Milisegundos entre que salta uno y el siguiente (efecto ola). */
  stagger: 45,
  /** Cuánto tarda en subir. */
  riseDuration: 110,
  /** El aterrizaje: un resorte bien rebotón. */
  land: { damping: 6, stiffness: 260 },
  /** El temblor de todo el grupo: cuánto se mueve de lado a lado y cuántas veces. */
  shake: { distance: 5, times: 3, stepDuration: 45 },
};

/** El nerd: se acomoda los lentes, pestañea y ladea la cabeza. */
export const Nerd = {
  /** Cuánto suben los lentes al acomodárselos, en puntos del dibujo (lienzo de 100). */
  glassesLift: 7,
  glassesUpDuration: 110,
  glassesSettle: { damping: 7, stiffness: 220 },
  /** Pestañeo: cuánto tarda en cerrar y abrir los ojos, y con qué retraso empieza. */
  blinkDelay: 140,
  blinkClose: 70,
  blinkOpen: 120,
  /** Ladeo de cabeza, en grados. */
  tilt: 8,
  tiltDuration: 140,
  tiltSettle: { damping: 8, stiffness: 180 },
};

/** La nave: se parte a la mitad con un destello, queda flotando y se vuelve a juntar. */
export const StarDestroyer = {
  /** Cuánto se separan las mitades hacia los lados, en puntos del dibujo (lienzo de 100). */
  split: 14,
  /** Cuánto gira cada mitad al separarse, en grados. */
  tilt: 16,
  /** Cuánto se van hacia atrás las mitades al romperse, en puntos del dibujo. */
  drift: 6,
  breakDuration: 260,
  breakEasing: Easing.out(Easing.cubic),
  /** Cuánto rato quedan separadas antes de volver, en milisegundos. */
  hold: 450,
  /** Cómo se vuelven a juntar. */
  rejoin: { damping: 12, stiffness: 140 },
  /** El destello rojo del centro. */
  flashDuration: 450,
  flashMaxScale: 2.2,
};

/* ─────────────────────────── LISTA DE CONTADORES ─────────────────────────── */

/** Reordenar los contadores de abajo: mantener presionado uno y arrastrarlo. */
export const ChipDrag = {
  /** Cuánto hay que mantener presionado antes de poder arrastrar, en milisegundos. */
  longPress: 300,
  /** Cuánto crece el contador que estás arrastrando. */
  liftScale: 1.08,
  /** Cuánto tardan los demás en correrse para hacerle espacio. */
  shiftDuration: 150,
};
