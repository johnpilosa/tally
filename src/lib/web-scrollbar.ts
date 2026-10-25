import { Platform } from 'react-native';

import { Colors } from '@/constants/theme';

/**
 * Solo en la versión web: la barra de scroll del navegador, fina, gris y sin fondo, para que
 * pegue con el resto de la app. En Android no hace nada (ahí la barra ya es nativa y discreta).
 */
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const thumb = Colors.dark.border;
  const style = document.createElement('style');
  style.textContent = `
    * { scrollbar-width: thin; scrollbar-color: ${thumb} transparent; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${thumb}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: ${Colors.dark.textSecondary}; }
    ::-webkit-scrollbar-corner { background: transparent; }
  `;
  document.head.appendChild(style);
}
