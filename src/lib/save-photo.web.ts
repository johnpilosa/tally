/**
 * En el navegador no hay carpeta de la app: la foto se guarda como texto (base64), que el
 * selector entrega cuando se le pide.
 */
export function savePhoto(asset: { uri: string; base64?: string | null; mimeType?: string }) {
  return asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : asset.uri;
}
