import { BlurTargetView, BlurView } from 'expo-blur';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Overlay } from '@/animations/config';

/*
 * Ventanas que aparecen encima de todo con el fondo desenfocado (menús, popups).
 *
 * En Android el desenfoque solo funciona si el contenido a desenfocar está dentro de un
 * BlurTargetView, así que la app entera va dentro de <BlurHost> y las ventanas se dibujan
 * en una capa encima, fuera de ese contenido.
 */

type Host = { set: (id: string, node: ReactNode | null) => void };

const HostContext = createContext<Host | null>(null);

export function BlurHost({ children }: { children: ReactNode }) {
  const target = useRef<ComponentRef<typeof View>>(null);
  const [nodes, setNodes] = useState<Record<string, ReactNode>>({});
  // Valor fijo: si cambiara en cada render, todas las pantallas se redibujarían sin parar.
  const [host] = useState<Host>(() => ({
    set: (id, node) =>
      setNodes((prev) => {
        if (node === null) {
          if (!(id in prev)) return prev;
          const { [id]: _removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [id]: node };
      }),
  }));

  const open = Object.entries(nodes);

  return (
    <HostContext.Provider value={host}>
      <BlurTargetView ref={target} style={styles.flex}>
        {children}
      </BlurTargetView>
      {open.map(([id, node]) => (
        <Animated.View
          key={id}
          entering={FadeIn.duration(Overlay.fadeIn)}
          exiting={FadeOut.duration(Overlay.fadeOut)}
          style={StyleSheet.absoluteFill}>
          <BlurView
            intensity={Overlay.blur}
            tint="dark"
            blurTarget={target}
            blurMethod="dimezisBlurViewSdk31Plus"
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Overlay.dim }]} />
          {node}
        </Animated.View>
      ))}
    </HostContext.Provider>
  );
}

/**
 * Muestra `children` encima de todo con el fondo desenfocado mientras `visible` sea true.
 * Tocar fuera del contenido llama a `onClose`. El contenido se posiciona solo (absoluto).
 */
export function BlurOverlay({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const host = useContext(HostContext);
  if (!host) throw new Error('BlurOverlay tiene que usarse dentro de <BlurHost>');
  const id = useId();

  // Se vuelve a mandar en cada redibujado para que el contenido esté siempre al día.
  useEffect(() => {
    host.set(
      id,
      visible ? (
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {children}
          </View>
        </View>
      ) : null,
    );
  });

  useEffect(() => () => host.set(id, null), [host, id]);

  return null;
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
