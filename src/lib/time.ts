import { Translations, type Lang } from '@/lib/i18n';

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

/** Cuántos días calendario pasaron entre `ts` y `now` (0 = hoy, 1 = ayer). */
function daysAgo(ts: number, now: number) {
  return Math.round((startOfDay(now) - startOfDay(ts)) / DAY);
}

/** "25 oct", o "25 oct 2025" si no es de este año. */
export function formatDate(ts: number, now = Date.now(), lang: Lang = 'en') {
  const d = new Date(ts);
  const date = `${d.getDate()} ${Translations[lang].months[d.getMonth()]}`;
  return d.getFullYear() === new Date(now).getFullYear() ? date : `${date} ${d.getFullYear()}`;
}

/** "Hoy", "Ayer" o "12 oct". */
export function formatDay(ts: number, now = Date.now(), lang: Lang = 'en') {
  const t = Translations[lang];
  const days = daysAgo(ts, now);
  if (days === 0) return t.today;
  if (days === 1) return t.yesterday;
  return formatDate(ts, now, lang);
}

/** "recién", "hace 5 min", "hace 3 h", "ayer 14:30", "12 oct". */
export function formatAgo(ts: number, now = Date.now(), lang: Lang = 'en') {
  const t = Translations[lang];
  const mins = Math.floor((now - ts) / 60000);
  if (mins < 1) return t.justNow;
  if (mins < 60) return t.minutesAgo(mins);
  const days = daysAgo(ts, now);
  if (days === 0) return t.hoursAgo(Math.floor(mins / 60));
  if (days === 1) return t.yesterdayAt(formatClock(ts));
  return formatDate(ts, now, lang);
}

export function countSince(events: number[], since: number) {
  return events.filter((ts) => ts >= since).length;
}

export function todayStart(now = Date.now()) {
  return startOfDay(now);
}

/** Agrupa timestamps por día, del más reciente al más viejo. */
export function groupByDay(events: number[], now = Date.now(), lang: Lang = 'en') {
  const groups: { label: string; items: number[] }[] = [];
  for (const ts of [...events].reverse()) {
    const label = formatDay(ts, now, lang);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(ts);
    else groups.push({ label, items: [ts] });
  }
  return groups;
}
