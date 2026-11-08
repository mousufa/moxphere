import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { lastDays, nice, shift, today, weekStart } from '../lib/date'

/* ---------- toast ---------- */
let toastMsg = ''
let toastTimer: ReturnType<typeof setTimeout> | undefined
const toastL = new Set<() => void>()
export function toast(m: string) {
  toastMsg = m
  toastL.forEach(l => l())
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMsg = ''
    toastL.forEach(l => l())
  }, 4500)
}
export function Toast() {
  const m = useSyncExternalStore(
    l => {
      toastL.add(l)
      return () => {
        toastL.delete(l)
      }
    },
    () => toastMsg,
  )
  return (
    <div className="toast" role="status" aria-live="polite" hidden={!m}>
      {m}
    </div>
  )
}

/* ---------- day rollover ---------- */
export function useToday() {
  const [d, setD] = useState(today())
  useEffect(() => {
    const t = setInterval(() => setD(today()), 30000)
    return () => clearInterval(t)
  }, [])
  return d
}

export function PH({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <header className="ph">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {right}
    </header>
  )
}

export function Sec({ title, right, children, sub }: { title: string; right?: ReactNode; children: ReactNode; sub?: string }) {
  return (
    <section className="sec">
      <header>
        <div>
          <h2>{title}</h2>
          {sub && <p className="dim small">{sub}</p>}
        </div>
        {right}
      </header>
      {children}
    </section>
  )
}

export function DateNav({ date, setDate }: { date: string; setDate: (d: string) => void }) {
  const t = today()
  return (
    <div className="row" style={{ borderBlock: '1px solid var(--line)', padding: '10px 0' }}>
      <button className="btn" onClick={() => setDate(shift(date, -1))} aria-label="Previous day">←</button>
      <span className="mono grow" style={{ textAlign: 'center', fontWeight: 500 }}>
        {date === t ? 'Today · ' : ''}
        {nice(date)}
      </span>
      {date !== t && <button className="btn" onClick={() => setDate(t)}>Today</button>}
      <button className="btn" onClick={() => setDate(shift(date, 1))} aria-label="Next day">→</button>
    </div>
  )
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 999, label, unit }: {
  value: number | undefined; onChange: (v: number | undefined) => void; step?: number; min?: number; max?: number; label: string; unit?: string
}) {
  const v = value ?? 0
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, +(v - step).toFixed(2)))} aria-label={`Less ${label}`}>−</button>
      <span>{value == null ? '–' : `${v}${unit ?? ''}`}</span>
      <button type="button" onClick={() => onChange(Math.min(max, +(v + step).toFixed(2)))} aria-label={`More ${label}`}>+</button>
    </div>
  )
}

export function Seg<T extends string | number>({ value, options, onChange, label }: {
  value: T | undefined; options: { v: T; t: string }[]; onChange: (v: T | undefined) => void; label: string
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(o => (
        <button type="button" key={String(o.v)} aria-pressed={value === o.v} onClick={() => onChange(value === o.v ? undefined : o.v)}>
          {o.t}
        </button>
      ))}
    </div>
  )
}

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="t">{children}</span>
    </label>
  )
}

export function Tiles({ items, four }: { items: { label: string; value: ReactNode; sub?: string }[]; four?: boolean }) {
  return (
    <div className={'tiles' + (four ? ' four' : '')}>
      {items.map(i => (
        <div className="tile" key={i.label}>
          <span className="label">{i.label}</span>
          <b>{i.value}</b>
          {i.sub && <small>{i.sub}</small>}
        </div>
      ))}
    </div>
  )
}

const lvl = (n: number) => (n <= 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4)
export function Heat({ value, label, weeks = 16 }: { value: (d: string) => number; label: (d: string, v: number) => string; weeks?: number }) {
  const t = today()
  const start = shift(weekStart(t), -(weeks - 1) * 7)
  const [read, setRead] = useState(`Last ${weeks} weeks`)
  const cells = []
  for (let i = 0; i < weeks * 7; i++) {
    const d = shift(start, i)
    if (d > t) {
      cells.push(<span key={d} className="cell pad" />)
      continue
    }
    const v = value(d)
    const txt = label(d, v)
    cells.push(
      <span key={d} className={`cell l${lvl(v)}${d === t ? ' today' : ''}`} title={txt} aria-label={txt} tabIndex={-1}
        onMouseEnter={() => setRead(txt)} onClick={() => setRead(txt)} />,
    )
  }
  return (
    <div className="sec" style={{ gap: 8 }}>
      <div className="heat">{cells}</div>
      <div className="row between">
        <span className="mono small dim">{read}</span>
        <span className="legend" aria-hidden="true">
          less <i style={{ background: 'var(--faint)' }} /><i style={{ background: 'var(--l1)' }} /><i style={{ background: 'var(--l2)' }} /><i style={{ background: 'var(--l3)' }} /><i style={{ background: 'var(--l4)' }} /> more
        </span>
      </div>
    </div>
  )
}

/** Daily columns for the last n days, one value each. */
export function DayCols({ n = 14, value, fmt, max }: { n?: number; value: (d: string) => number | undefined; fmt: (v: number) => string; max?: number }) {
  const days = lastDays(n)
  const vals = days.map(d => value(d) ?? 0)
  const top = max ?? Math.max(1, ...vals)
  return (
    <div>
      <div className="cols-chart">
        {days.map((d, i) => (
          <span key={d} className={vals[i] ? '' : 'zero'} style={{ height: `${(vals[i] / top) * 100}%` }} title={`${nice(d)}: ${vals[i] ? fmt(vals[i]) : 'nothing'}`} />
        ))}
      </div>
      <div className="axis">
        <span>{nice(days[0], { day: 'numeric', month: 'short' })}</span>
        <span>Today</span>
      </div>
    </div>
  )
}

export function Bars({ rows }: { rows: { key: string; name: string; v: number; max: number; val: string; href?: string; flag?: string }[] }) {
  return (
    <div className="bars">
      {rows.map(r => {
        const inner = (
          <>
            <span className="name">{r.name}</span>
            <span className="track" title={`${r.name}: ${r.val}`}>
              <span className="fill" style={{ width: `${r.max ? Math.min(100, (r.v / r.max) * 100) : 0}%` }} />
            </span>
            <span className="val">{r.flag ? <span className="flag">{r.flag}</span> : r.val}</span>
          </>
        )
        return r.href ? <a key={r.key} className="bar" href={r.href}>{inner}</a> : <div key={r.key} className="bar">{inner}</div>
      })}
    </div>
  )
}

export function ListEditor({ items, onChange, placeholder, label }: { items: string[]; onChange: (v: string[]) => void; placeholder: string; label: string }) {
  const [v, setV] = useState('')
  return (
    <div className="sec" style={{ gap: 6 }}>
      {items.length > 0 && (
        <ul className="list">
          {items.map((it, i) => (
            <li key={i}>
              <span style={{ padding: '8px 0', overflowWrap: 'anywhere' }}>{it}</span>
              <button className="x" aria-label={`Remove ${it}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>×</button>
            </li>
          ))}
        </ul>
      )}
      <form className="row" onSubmit={e => {
        e.preventDefault()
        if (!v.trim()) return
        onChange([...items, v.trim()])
        setV('')
      }}>
        <input type="text" className="grow" style={{ flex: 1 }} value={v} onChange={e => setV(e.target.value)} placeholder={placeholder} aria-label={label} maxLength={400} />
        <button className="btn">Add</button>
      </form>
    </div>
  )
}
