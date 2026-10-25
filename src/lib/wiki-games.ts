/**
 * Búsqueda de juegos y su info (resumen y portada) usando Wikipedia en inglés.
 * No necesita clave. Si en el futuro se quiere usar otra fuente (por ejemplo SteamGridDB para
 * portadas), este es el único archivo que hay que cambiar.
 */

const WIKI = 'https://en.wikipedia.org';

export type GameHit = {
  /** Identificador de la página en Wikipedia, por ejemplo "Ace_Combat_04:_Shattered_Skies". */
  key: string;
  title: string;
  /** Por ejemplo "2001 video game". */
  description: string;
};

export type GameInfo = GameHit & {
  summary: string;
  coverUrl: string | null;
};

/** Solo páginas de juegos: "2001 video game" sí, "video game series" o "film" no. */
function isGame(description: string | null | undefined) {
  if (!description) return false;
  return (
    /video game/i.test(description) && !/series|franchise|character|company/i.test(description)
  );
}

/** Busca juegos cuyo nombre empiece con `query` (para el autocompletar). */
export async function searchGames(query: string, signal?: AbortSignal): Promise<GameHit[]> {
  const url = `${WIKI}/w/rest.php/v1/search/title?q=${encodeURIComponent(query)}&limit=20`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
  const data: { pages: { key: string; title: string; description?: string }[] } = await res.json();
  return data.pages
    .filter((p) => isGame(p.description))
    .map((p) => ({ key: p.key, title: p.title, description: p.description ?? '' }));
}

/** Trae el resumen y la portada (la imagen principal del artículo, normalmente la carátula). */
export async function fetchGame(key: string, signal?: AbortSignal): Promise<GameInfo> {
  const res = await fetch(`${WIKI}/api/rest_v1/page/summary/${encodeURIComponent(key)}`, {
    signal,
  });
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
  const data: {
    key?: string;
    title: string;
    description?: string;
    extract?: string;
    originalimage?: { source: string };
    thumbnail?: { source: string };
  } = await res.json();
  return {
    key,
    title: data.title,
    description: data.description ?? '',
    summary: data.extract ?? '',
    coverUrl: data.originalimage?.source ?? data.thumbnail?.source ?? null,
  };
}

/** El año que aparece en la descripción ("2001 video game" → "2001"), si hay. */
export function yearOf(description: string) {
  return description.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
}

export type Screenshot = { url: string; caption: string };

/** Palabras en el nombre del archivo que indican que no es una captura del juego. */
const NOT_A_SCREENSHOT =
  /cover|box|logo|poster|console|controller|e3|portrait|photo|signature|\.svg/i;

/**
 * Capturas del juego que aparecen en su artículo. Se descarta la portada y las fotos que no
 * son del juego (consolas, personas, logos); se quedan las que tienen "screenshot" o "gameplay"
 * en el nombre, o el nombre del juego.
 */
export async function fetchScreenshots(key: string, signal?: AbortSignal): Promise<Screenshot[]> {
  const res = await fetch(`${WIKI}/api/rest_v1/page/media-list/${encodeURIComponent(key)}`, {
    signal,
  });
  if (!res.ok) return [];
  const data: {
    items: {
      type: string;
      title: string;
      srcset?: { src: string; scale: string }[];
      caption?: { text: string };
    }[];
  } = await res.json();
  const gameWords = key
    .split(/[_:()]+/)
    .filter((w) => w.length > 3)
    .map((w) => w.toLowerCase());
  return data.items
    .filter((it, i) => it.type === 'image' && i > 0 && it.srcset?.length)
    .filter((it) => !NOT_A_SCREENSHOT.test(it.title))
    .filter((it) => {
      const name = it.title.toLowerCase();
      return /screenshot|gameplay/.test(name) || gameWords.some((w) => name.includes(w));
    })
    .slice(0, 6)
    .map((it) => {
      const best = it.srcset![it.srcset!.length - 1].src;
      return {
        url: best.startsWith('//') ? `https:${best}` : best,
        caption: it.caption?.text ?? '',
      };
    });
}
