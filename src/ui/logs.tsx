import { useState, useSyncExternalStore } from 'react'
import { D, DEFAULT_CONFIG, K, LOGGABLE } from '../lib/model'
import { mins, nice, today, uid } from '../lib/date'
import { update, useDoc, useStore } from '../lib/store'
import { branch, branches, config, leafName, logsOn } from '../lib/stats'
import { Check, toast } from './bits'

/* ---------- log dialog (opened from anywhere) ---------- */
interface Open { area: string; track?: string; date?: string; note?: string; who?: string }
let open: Open | null = null
const L = new Set<() => void>()
export function openLog(o: Open) {
  open = o
  L.forEach(l => l())
}
const close = () => {
  open = null
  L.forEach(l => l())
}
const loggableBranches = () => branches().filter(b => b.leaves.some(l => LOGGABLE.includes(l.kind)))
const loggableLeaves = (b: string) => (branch(b)?.leaves ?? []).filter(l => LOGGABLE.includes(l.kind))

export function LogDialog() {
  const o = useSyncExternalStore(
    l => {
      L.add(l)
      return () => {
        L.delete(l)
      }
    },
    () => open,
  )
  if (!o) return null
  return <LogForm key={JSON.stringify(o)} o={o} />
}

function LogForm({ o }: { o: Open }) {
  useStore()
  const [area, setArea] = useState(loggableBranches().some(b => b.id === o.area) ? o.area : 'learning')
  const leaves = loggableLeaves(area)
  const [track, setTrack] = useState(o.track && leaves.some(l => l.id === o.track) ? o.track : leaves[0]?.id ?? '')
  const [date, setDate] = useState(o.date ?? today())
  const [m, setM] = useState('')
  const [note, setNote] = useState(o.note ?? '')
  const timed = ['learning', 'project', 'building', 'research', 'career'].includes(area)
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const minutes = Math.max(0, Math.round(Number(m) || 0))
    if (!minutes && !note.trim()) return toast('Add the minutes or a note.')
    update(K.logs(date), D.logs, l => {
      l.items.push({ id: uid(), area, track: track || 'general', mins: minutes, note: note.trim(), ...(o.who ? { who: o.who } : {}) })
    })
    toast(`Logged in ${leafName(track)}.`)
    close()
  }
  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && close()}>
      <form className="dialog" onSubmit={save} role="dialog" aria-modal="true" aria-labelledby="logTitle" onKeyDown={e => e.key === 'Escape' && close()}>
        <h2 id="logTitle">Log it</h2>
        <div className="form">
          <label className="field">
            <span className="label">Branch</span>
            <select value={area} onChange={e => { setArea(e.target.value); setTrack(loggableLeaves(e.target.value)[0]?.id ?? '') }}>
              {loggableBranches().map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="label">Which part</span>
            <select value={track} onChange={e => setTrack(e.target.value)}>
              {leaves.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
        </div>
        <div className="form">
          <label className="field">
            <span className="label">Minutes{timed ? '' : ' (optional)'}</span>
            <input type="number" inputMode="numeric" min={0} max={1440} value={m} onChange={e => setM(e.target.value)} placeholder="30" />
          </label>
          <label className="field">
            <span className="label">Date</span>
            <input type="date" value={date} max={today()} onChange={e => e.target.value && setDate(e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span className="label">Note</span>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What did you do?" style={{ minHeight: 80 }} />
        </label>
        <div className="row">
          <button className="btn primary">Save</button>
          <button type="button" className="btn" onClick={close}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

/* ---------- list of logs ---------- */
export function LogList({ area, days, track, empty }: { area?: string; days: string[]; track?: string; empty?: string }) {
  useStore()
  const rows = days.flatMap(d => logsOn(d).filter(l => (!area || l.area === area) && (!track || l.track === track)).map(l => ({ ...l, d }))).reverse()
  if (!rows.length) return <p className="empty">{empty ?? 'Nothing logged yet.'}</p>
  return (
    <ul className="list">
      {rows.slice(0, 40).map(l => (
        <li key={l.id}>
          <div style={{ padding: '8px 0' }}>
            <div className="row small" style={{ gap: 8 }}>
              <span className="dim">{nice(l.d)}</span>
              {!track && <span style={{ fontWeight: 600 }}>{leafName(l.track)}</span>}
              {l.mins > 0 && <span className="dim">{mins(l.mins)}</span>}
            </div>
            {l.note && <p style={{ overflowWrap: 'anywhere' }}>{l.note}</p>}
          </div>
          <button className="x" aria-label="Remove this entry" onClick={() =>
            update(K.logs(l.d), D.logs, x => {
              x.items = x.items.filter(i => i.id !== l.id)
            })}>×</button>
        </li>
      ))}
    </ul>
  )
}

/* ---------- daily habits for any part of the map ---------- */
export function Habits({ scope, date, placeholder = 'Add a daily habit' }: { scope: string; date: string; placeholder?: string }) {
  const [done, setDone] = useDoc(K.habits(date), D.habits)
  const [, setCfg] = useDoc(K.config, DEFAULT_CONFIG)
  const [v, setV] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)
  const hs = config().habits.filter(h => h.area === scope)
  return (
    <div className="sec" style={{ gap: 4 }}>
      {hs.length > 0 && (
        <ul className="list">
          {hs.map(h => (
            <li key={h.id}>
              <Check checked={!!done[h.id]} onChange={c => setDone(d => { d[h.id] = c })}>{h.name}</Check>
              <button className="x small" onClick={() => {
                if (confirm !== h.id) return setConfirm(h.id)
                setCfg(c => { c.habits = config().habits.filter(x => x.id !== h.id) })
                setConfirm(null)
              }}>{confirm === h.id ? 'Remove from every day?' : '×'}</button>
            </li>
          ))}
        </ul>
      )}
      <form className="row" onSubmit={e => {
        e.preventDefault()
        if (!v.trim()) return
        setCfg(c => { c.habits = [...config().habits, { id: uid(), area: scope, name: v.trim() }] })
        setV('')
      }}>
        <input type="text" style={{ flex: 1 }} value={v} onChange={e => setV(e.target.value)} placeholder={placeholder} aria-label={placeholder} maxLength={120} />
        <button className="btn">Add</button>
      </form>
    </div>
  )
}
