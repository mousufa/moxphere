import { get } from './store'
import { BRANCHES, D, DEFAULT_CONFIG, K, LIFE, PRAYERS, type Branch, type BranchId, type Config, type Leaf } from './model'
import { shift, today, weekDays } from './date'

export const config = (): Config => {
  const c = get(K.config, DEFAULT_CONFIG)
  return { ...DEFAULT_CONFIG, ...c, extraLeaves: c.extraLeaves || [], habits: c.habits || [], reminder: { ...DEFAULT_CONFIG.reminder, ...c.reminder } }
}

/* ---------- the map ---------- */
export const branches = (): Branch[] =>
  BRANCHES.map(b => ({ ...b, leaves: [...b.leaves, ...config().extraLeaves.filter(x => x.branch === b.id).map(x => x.leaf)] }))
export const branch = (id: string) => branches().find(b => b.id === id)
export function findLeaf(id: string): { b: Branch; l: Leaf } | null {
  for (const b of branches()) {
    const l = b.leaves.find(x => x.id === id)
    if (l) return { b, l }
  }
  return null
}
/** Names for entries logged under the earlier layout. */
const OLD_NAMES: Record<string, string> = {
  drugs: 'Drug knowledge', exam: 'University exam', da: 'Data analysis', aipharma: 'AI roles in pharma', express: 'Expressing myself',
  emo: 'Emotional control', conn: 'Connections', trip: 'Small trip', create: 'Creating something', general: 'General',
}
export const leafName = (id: string) => findLeaf(id)?.l.name ?? OLD_NAMES[id] ?? id
export const trackName = leafName

/* ---------- logs ---------- */
const ALIAS: Record<string, BranchId> = { study: 'learning', hustles: 'building', social: 'self', selfcare: 'joy' }
const CAREER_IDS = ['cdm', 'heor', 'ra', 'cr']
const normArea = (area: string, track: string): string => (area === 'study' && CAREER_IDS.includes(track) ? 'career' : ALIAS[area] ?? area)
export const logsOn = (d: string) => get(K.logs(d), D.logs).items.map(l => ({ ...l, area: normArea(l.area, l.track) }))
export const logsFor = (area: string, d: string, track?: string) => logsOn(d).filter(l => l.area === area && (!track || l.track === track))

export const habitsOf = (scope: string) => config().habits.filter(h => h.area === scope)
export function habitsDone(scope: string, d: string) {
  const done = get(K.habits(d), D.habits)
  return habitsOf(scope).filter(h => done[h.id]).length
}
export function prayed(d: string) {
  const p = get(K.akhira(d), D.akhira).p || {}
  return {
    onTime: PRAYERS.filter(([k]) => p[k] === 'on').length,
    prayed: PRAYERS.filter(([k]) => p[k] === 'on' || p[k] === 'late').length,
  }
}
export const akhiraDay = (d: string) => get(K.akhira(d), D.akhira)
const dailyDone = (id: string, d: string) => {
  const a = akhiraDay(d)
  return !!(a.checks?.[id] || (a.counts?.[id] ?? 0) > 0 || (id === 'dhikr' && a.dhikr) || (id === 'nafs' && a.noNeg))
}

/** Things done for one leaf on one day. */
export function leafScore(l: Leaf, d: string): number {
  let s = habitsDone(l.id, d)
  switch (l.kind) {
    case 'prayer': return s + prayed(d).prayed + (akhiraDay(d).jumuah ? 1 : 0)
    case 'quran': return s + ((akhiraDay(d).quran ?? 0) > 0 ? 1 : 0)
    case 'daily': return s + (dailyDone(l.id, d) ? 1 : 0)
    case 'health': {
      const h = get(K.health(d), D.health)
      return s + [h.sleep, h.water, h.move, h.mood, h.energy].filter(v => v != null).length
    }
    case 'link': return 0
    default:
      s += logsOn(d).filter(x => x.track === l.id).length
      if (l.kind === 'project') s += get(K.leaf(l.id), D.leaf).updates.filter(u => u.date === d).length
      return s
  }
}
/** Things done for a whole branch on one day. Above 0 means it was looked after. */
export function score(id: string, d: string): number {
  const b = branch(id)
  if (!b) return 0
  const ids = new Set(b.leaves.map(l => l.id))
  let s = b.leaves.reduce((a, l) => a + leafScore(l, d), 0) + habitsDone(id, d)
  // entries logged against this branch under a part that no longer exists
  s += logsOn(d).filter(x => x.area === id && !ids.has(x.track)).length
  return s
}
export const minutes = (area: string, d: string, track?: string) =>
  logsFor(area, d, track).reduce((a, l) => a + (l.mins || 0), 0) + (area === 'health' && !track ? get(K.health(d), D.health).move || 0 : 0)

export const sumDays = (days: string[], f: (d: string) => number) => days.reduce((a, d) => a + f(d), 0)
export const activeDays = (area: string, days: string[]) => days.filter(d => score(area, d) > 0).length

export function daysSince(f: (d: string) => number): number | null {
  let d = today()
  for (let i = 0; i < 400; i++) {
    if (f(d) > 0) return i
    d = shift(d, -1)
  }
  return null
}
export function streakOf(f: (d: string) => number) {
  let d = today()
  if (!f(d)) d = shift(d, -1)
  let n = 0
  while (f(d) > 0 && n < 2000) {
    n++
    d = shift(d, -1)
  }
  return n
}
export const drainMins = (d: string) => get(K.drains(d), D.drains).items.reduce((a, x) => a + (x.mins || 0), 0)
export const focusMins = (d: string) => logsOn(d).reduce((a, l) => a + (l.mins || 0), 0)

export function balance(day: string) {
  const days = weekDays(day).filter(d => d <= today())
  return LIFE.map(b => ({
    id: b.id, name: b.name,
    active: activeDays(b.id, days),
    mins: sumDays(days, d => minutes(b.id, d)),
    since: daysSince(d => score(b.id, d)),
    days: days.length,
  }))
}
