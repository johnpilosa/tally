import { useEffect, useState } from 'react';

/** Devuelve la hora actual y re-renderiza cada `intervalMs`, para que "hace 5 min" se mantenga al día. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
