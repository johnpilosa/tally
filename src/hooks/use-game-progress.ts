import { useCallback, useEffect, useState } from 'react';

import { fetchProgress, useRA, type RAProgress } from '@/lib/retro-achievements';

/**
 * Los logros de un juego en RetroAchievements, con tu avance. `refresh` los vuelve a pedir
 * (para revisar si sacaste uno) y devuelve lo nuevo, o null si no se pudo.
 */
export function useGameProgress(raGameId: number | undefined) {
  const { account } = useRA();
  const [progress, setProgress] = useState<RAProgress | null>(null);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    if (!account || !raGameId) return null;
    try {
      const next = await fetchProgress(account, raGameId);
      setProgress(next);
      setFailed(false);
      return next;
    } catch {
      setFailed(true);
      return null;
    }
  }, [account, raGameId]);

  useEffect(() => {
    if (!account || !raGameId) return;
    let active = true;
    fetchProgress(account, raGameId)
      .then((p) => active && setProgress(p))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [account, raGameId]);

  return { progress, failed, refresh };
}
