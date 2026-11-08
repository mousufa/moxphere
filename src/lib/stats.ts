import { get } from './store'
import { AREAS, D, DEFAULT_CONFIG, K, PRAYERS, type AreaId, type Config } from './model'
import { lastDays, shift, today, weekDays } from './date'

export const config = (): Config => {
  const c = get(K.config, DEFAULT_CONFIG)
  return { ...DEFAULT_CONFIG, ...c, reminder: { ...DEFAULT_CONFIG.reminder, ...c.reminder }, exam: { ...DEFAULT_CONFIG.exam, ...c.exam } }
}
export const tracksOf = (area: AreaId) => config().tracks.filter(t => t.area === area)
export const trackName = (id: string) => config().tracks.find(t => t.id === id)?.name ?? id
export const habitsOf = (area: AreaId) => config().habits.filter(h => h.area === area)

export const logsOn = (d: string) => get(K.logs(d), D.logs).items
export const logsFor = (area: AreaId, d: string, track?: string) =>
  logsOn(d).filter(l => l.area === area && (!track || l.track === track))

export function habitsDone(area: AreaId, d: string) {
  const done = get(K.habits(d), D.habits)
  return habitsOf(area).filter(h => done[h.id]).length
}

export function prayed(d: string) {
  const a = get(K.akhira(d), D.akhira)
  const p = a.p || {}
  return {
    onTime: PRAYERS.filter(([k]) => p[k] === 'on').length,
    prayed: PRAYERS.filter(([k]) => p[k] === 'on' || p[k] === 'late').length,
    a,
  }
}

/** Number of things done in an area on a day. Above 0 means the area was looked after that day. */
export function score(area: AreaId, d: string): number {
  let s = habitsDone(area, d)
  if (area === 'health') {
    const h = get(K.health(d), D.health)
    s += [h.sleep, h.water, h.move, h.mood, h.energy].filter(v => v != null).length
    s += logsFor('health', d).length
  } else if (area === 'akhira') {
    const { prayed: n, a } = prayed(d)
    s += n + (a.quran ? 1 : 0) + (a.dhikr ? 1 : 0) + (a.jumuah ? 1 : 0) + (a.noNeg ? 1 : 0)
  } else {
    s += logsFor(area, d).length
  }
  return s
}
export const minutes = (area: AreaId, d: string, track?: string) =>
  logsFor(area, d, track).reduce((a, l) => a + (l.mins || 0), 0) + (area === 'health' && !track ? get(K.health(d), D.health).move || 0 : 0)

export const sumDays = (days: string[], f: (d: string) => number) => days.reduce((a, d) => a + f(d), 0)
export const activeDays = (area: AreaId, days: string[]) => days.filter(d => score(area, d) > 0).length

export function daysSince(area: AreaId, track?: string): number | null {
  let d = today()
  for (let i = 0; i < 400; i++) {
    const hit = track ? logsFor(area, d, track).length > 0 : score(area, d) > 0
    if (hit) return i
    d = shift(d, -1)
  }
  return null
}
export function streak(area: AreaId) {
  let d = today()
  if (!score(area, d)) d = shift(d, -1)
  let n = 0
  while (score(area, d) > 0 && n < 2000) {
    n++
    d = shift(d, -1)
  }
  return n
}
export const drainMins = (d: string) => get(K.drains(d), D.drains).items.reduce((a, x) => a + (x.mins || 0), 0)
export const focusMins = (d: string) => logsOn(d).reduce((a, l) => a + (l.mins || 0), 0)

export function balance(week: string) {
  const days = weekDays(week).filter(d => d <= today())
  return AREAS.map(a => ({
    ...a,
    active: activeDays(a.id, days),
    mins: sumDays(days, d => minutes(a.id, d)),
    since: daysSince(a.id),
    days: days.length,
  }))
}
export const recent = (n: number) => lastDays(n)
