const pad = (n: number) => String(n).padStart(2, '0')

export const dkey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => dkey(new Date())
export const parse = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const shift = (k: string, n: number) => {
  const d = parse(k)
  d.setDate(d.getDate() + n)
  return dkey(d)
}
export const range = (from: string, n: number) => Array.from({ length: n }, (_, i) => shift(from, i))
export const lastDays = (n: number, end = today()) => range(shift(end, -(n - 1)), n)
export const daysBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000)

/** Weeks start on Monday. */
export const weekStart = (k: string) => {
  const d = parse(k)
  return shift(k, -((d.getDay() + 6) % 7))
}
export const weekDays = (k: string) => range(weekStart(k), 7)

export const nice = (k: string, o?: Intl.DateTimeFormatOptions) =>
  parse(k).toLocaleDateString('en-IN', o || { weekday: 'short', day: 'numeric', month: 'short' })
export const longDate = (k: string) => nice(k, { weekday: 'long', day: 'numeric', month: 'long' })
export const weekLabel = (k: string) => {
  const s = weekStart(k)
  return `${nice(s, { day: 'numeric', month: 'short' })} – ${nice(shift(s, 6), { day: 'numeric', month: 'short' })}`
}

export const mins = (m: number) => {
  m = Math.round(m)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}`
}
export const hourLabel = (h: number) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`
export const isFriday = (k: string) => parse(k).getDay() === 5
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
