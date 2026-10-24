const pad = (n: number) => String(n).padStart(2, '0');

export function formatClock(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const DAY = 24 * 60 * 60 * 1000;
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "Hoy", "Ayer" o "12 oct". */
export function formatDay(ts: number, now = Date.now()) {
  const diffDays = Math.round((startOfDay(now) - startOfDay(ts)) / DAY);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "25 oct", o "25 oct 2025" si no es de este año. */
export function formatDate(ts: number, now = Date.now()) {
  const d = new Date(ts);
  const date = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === new Date(now).getFullYear() ? date : `${date} ${d.getFullYear()}`;
}

/** "recién", "hace 5 min", "hace 3 h", "ayer 14:30", "12 oct". */
export function formatAgo(ts: number, now = Date.now()) {
  const mins = Math.floor((now - ts) / 60000);
  if (mins < 1) return 'recién';
  if (mins < 60) return `hace ${mins} min`;
  const day = formatDay(ts, now);
  if (day === 'Hoy') return `hace ${Math.floor(mins / 60)} h`;
  if (day === 'Ayer') return `ayer ${formatClock(ts)}`;
  return day;
}

export function countSince(events: number[], since: number) {
  return events.filter((ts) => ts >= since).length;
}

export function todayStart(now = Date.now()) {
  return startOfDay(now);
}

/** Agrupa timestamps por día, del más reciente al más viejo. */
export function groupByDay(events: number[], now = Date.now()) {
  const groups: { label: string; items: number[] }[] = [];
  for (const ts of [...events].reverse()) {
    const label = formatDay(ts, now);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(ts);
    else groups.push({ label, items: [ts] });
  }
  return groups;
}
