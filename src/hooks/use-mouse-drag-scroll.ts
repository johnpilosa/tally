import { useEffect, type ComponentRef, type RefObject } from 'react';
import { Platform, type ScrollView } from 'react-native';

/**
 * Solo en el navegador: permite desplazar un ScrollView horizontal arrastrándolo con el mouse,
 * como se hace con el dedo en el celular. En el celular no hace nada.
 *
 * `pausedRef` en `true` lo desactiva (por ejemplo, mientras se reordena un chip).
 */
export function useMouseDragScroll(
  scrollRef: RefObject<ComponentRef<typeof ScrollView> | null>,
  pausedRef: RefObject<boolean>,
) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = (
      scrollRef.current as unknown as { getScrollableNode?: () => HTMLElement } | null
    )?.getScrollableNode?.();
    if (!node) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let dragging = false;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = node.scrollLeft;
      dragging = false;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId || pausedRef.current) return;
      const dx = e.clientX - startX;
      // Unos pocos píxeles de margen para no confundir un clic con un arrastre.
      if (!dragging && Math.abs(dx) < 5) return;
      dragging = true;
      node.scrollLeft = startScroll - dx;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId === pointerId) pointerId = null;
    };

    node.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      node.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [scrollRef, pausedRef]);
}
