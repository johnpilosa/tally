import * as Haptics from 'expo-haptics';
import { useRef, type ComponentRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { ChipDrag } from '@/animations/config';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useMouseDragScroll } from '@/hooks/use-mouse-drag-scroll';
import type { Tally } from '@/lib/tallies';

const C = Colors.dark;
const GAP = Spacing.two;

/** Lo que comparten todos los chips mientras uno se arrastra. Vive en el hilo de animaciones. */
type DragState = {
  /** Id del contador que se está arrastrando, o '' si ninguno. */
  dragId: SharedValue<string>;
  /** Posición donde caería si lo sueltas ahora. */
  hoverIndex: SharedValue<number>;
  dragX: SharedValue<number>;
  /** Ancho de cada chip, por id. Con esto se calcula dónde está cada uno. */
  widths: SharedValue<Record<string, number>>;
};

/**
 * La fila de contadores de abajo.
 * - Tocar uno lo pone al centro.
 * - Mantenerlo presionado y arrastrarlo lo cambia de lugar.
 * - En el navegador, la fila también se puede arrastrar con el mouse para desplazarla.
 */
export function TallyChips({
  tallies,
  currentId,
  onSelect,
  onMove,
  onAdd,
}: {
  tallies: Tally[];
  currentId: string;
  onSelect: (id: string) => void;
  onMove: (id: string, toIndex: number) => void;
  onAdd: () => void;
}) {
  const drag: DragState = {
    dragId: useSharedValue(''),
    hoverIndex: useSharedValue(-1),
    dragX: useSharedValue(0),
    widths: useSharedValue<Record<string, number>>({}),
  };
  const ids = tallies.map((t) => t.id);

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const reordering = useRef(false);
  useMouseDragScroll(scrollRef, reordering);

  const onDragStart = () => {
    reordering.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const onDrop = (id: string, from: number, to: number) => {
    reordering.current = false;
    if (from !== to) onMove(id, to);
    // Se sueltan los desplazamientos en el próximo cuadro, cuando la lista ya se dibujó en su
    // nuevo orden; si no, los chips saltarían un instante a su lugar viejo.
    requestAnimationFrame(() => {
      drag.dragId.set('');
      drag.hoverIndex.set(-1);
      drag.dragX.set(0);
    });
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}>
      {tallies.map((t, i) => (
        <Chip
          key={t.id}
          tally={t}
          index={i}
          ids={ids}
          active={t.id === currentId}
          drag={drag}
          onSelect={onSelect}
          onDragStart={onDragStart}
          onDrop={onDrop}
        />
      ))}
      <Pressable onPress={onAdd} style={styles.chip}>
        <Text style={styles.text}>+ NUEVO</Text>
      </Pressable>
    </ScrollView>
  );
}

function Chip({
  tally,
  index,
  ids,
  active,
  drag,
  onSelect,
  onDragStart,
  onDrop,
}: {
  tally: Tally;
  index: number;
  /** Los ids de todos los chips, en orden. */
  ids: string[];
  active: boolean;
  drag: DragState;
  onSelect: (id: string) => void;
  onDragStart: () => void;
  onDrop: (id: string, from: number, to: number) => void;
}) {
  const { dragId, hoverIndex, dragX, widths } = drag;
  const id = tally.id;

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(onSelect)(id);
  });

  const pan = Gesture.Pan()
    .activateAfterLongPress(ChipDrag.longPress)
    .onStart(() => {
      dragId.set(id);
      hoverIndex.set(index);
      dragX.set(0);
      runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      dragX.set(e.translationX);
      // Calcula el centro de cada chip sumando los anchos, y cuenta cuántos de los otros
      // quedan a la izquierda del que se arrastra: esa es la posición donde caería.
      const w = widths.get();
      const centers: number[] = [];
      let x = 0;
      for (let j = 0; j < ids.length; j++) {
        const width = w[ids[j]] ?? 0;
        centers.push(x + width / 2);
        x += width + GAP;
      }
      const center = centers[index] + e.translationX;
      let target = 0;
      for (let j = 0; j < centers.length; j++) {
        if (j !== index && centers[j] < center) target++;
      }
      hoverIndex.set(target);
    })
    .onEnd(() => {
      runOnJS(onDrop)(id, index, hoverIndex.get());
    });

  const style = useAnimatedStyle(() => {
    const dragging = dragId.get();
    if (dragging === id) {
      return {
        zIndex: 10,
        transform: [{ translateX: dragX.get() }, { scale: withSpring(ChipDrag.liftScale) }],
      };
    }
    if (dragging === '') {
      // Sin animar al soltar: la lista ya se reordenó y cada chip está en su nuevo lugar.
      return { zIndex: 0, transform: [{ translateX: 0 }, { scale: 1 }] };
    }
    // Los demás se corren un espacio para hacerle lugar al que se arrastra.
    const from = ids.indexOf(dragging);
    const to = hoverIndex.get();
    const space = (widths.get()[dragging] ?? 0) + GAP;
    let shift = 0;
    if (index > from && index <= to) shift = -space;
    if (index < from && index >= to) shift = space;
    return {
      zIndex: 0,
      transform: [
        { translateX: withTiming(shift, { duration: ChipDrag.shiftDuration }) },
        { scale: 1 },
      ],
    };
  });

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <Animated.View
        onLayout={(e) => {
          const width = e.nativeEvent.layout.width;
          widths.set({ ...widths.get(), [id]: width });
        }}
        accessibilityRole="button"
        accessibilityLabel={tally.name}
        style={[styles.chip, active && styles.chipActive, styles.draggable, style]}>
        {active && <View style={styles.dot} />}
        <Text style={[styles.text, active && styles.textActive]}>
          {tally.name.toUpperCase()} {tally.events.length}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { gap: GAP, paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: C.background,
  },
  chipActive: { borderColor: C.text },
  // En el navegador: que no se seleccione el texto al arrastrar.
  draggable: Platform.OS === 'web' ? { userSelect: 'none', cursor: 'grab' } : {},
  text: { fontFamily: Type.mono, fontSize: 12, color: C.textSecondary },
  textActive: { color: C.text },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
});
