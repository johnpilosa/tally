import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

/**
 * Un número que sube cada vez que vuelves a esta pantalla (por ejemplo, al volver de una
 * reseña). Úsalo como `key` del contenido para que se vuelva a montar y sus animaciones de
 * entrada se repitan, en vez de que todo aparezca de golpe.
 */
export function useFocusKey() {
  const [key, setKey] = useState(0);
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      // La primera vez la pantalla recién se montó y ya está animando: no hace falta repetir.
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      setKey((k) => k + 1);
    }, []),
  );
  return key;
}
