import { File, Paths } from 'expo-file-system';

/**
 * Copia la foto elegida a la carpeta de la app, para que no se pierda cuando el sistema limpie
 * la caché donde la deja el selector. Devuelve la dirección de la copia.
 */
export function savePhoto(asset: { uri: string }, previous: string | null): string {
  const copy = new File(Paths.document, `avatar-${Date.now()}.jpg`);
  new File(asset.uri).copySync(copy);
  // La foto anterior ya no se usa.
  if (previous?.startsWith('file:')) {
    try {
      new File(previous).delete();
    } catch {}
  }
  return copy.uri;
}
