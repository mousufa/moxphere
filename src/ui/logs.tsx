import { useState, useSyncExternalStore } from 'react'
import { AREAS, D, DEFAULT_CONFIG, K, areaName, type AreaId } from '../lib/model'
import { mins, nice, today, uid } from '../lib/date'
import { update, useDoc, useStore } from '../lib/store'
import { config, logsFor, trackName, tracksOf } from '../lib/stats'
import { Check, toast } from './bits'

/* ---------- log dialog (opened from anywhere) ---------- */
interface Open { area: AreaId; track?: string; date?: string; note?: string }
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

const PROMPT: Record<AreaId, string> = {
  health: 'What did you do?',
  study: 'What did you learn or revise?',
  social: 'What happened? What did you do well?',
  akhira: 'What did you do?',
  selfcare: 'Where did you go, what did you make or eat?',
  hustles: 'What did you work on?',
}

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
  const [area, setArea] = useState<AreaId>(o.area)
  const tracks = tracksOf(area)
  const [track, setTrack] = useState(o.track ?? tracks[0]?.id ?? '')
  const [date, setDate] = useState(o.date ?? today())
  const [m, setM] = useState('')
  const [note, setNote] = useState(o.note ?? '')
  const timed = area === 'study' || area === 'hustles'
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const minutes = Math.max(0, Math.round(Number(m) || 0))
    if (timed && !minutes && !note.trim()) return toast('Add the minutes or a note.')
    update(K.logs(date), D.logs, l => {
      l.items.push({ id: uid(), area, track: track || 'general', mins: minutes, note: note.trim() })
    })
    toast(`Logged in ${areaName(area)}.`)
    close()
  }
  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && close()}>
      <form className="dialog" onSubmit={save} role="dialog" aria-modal="true" aria-labelledby="logTitle"
        onKeyDown={e => e.key === 'Escape' && close()}>
        <h2 id="logTitle">Log it</h2>
        <label className="field">
          <span className="label">Area</span>
          <select value={area} onChange={e => {
            const a = e.target.value as AreaId
            setArea(a)
            setTrack(tracksOf(a)[0]?.id ?? '')
          }}>
            {AREAS.filter(a => a.id !== 'akhira').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        {tracks.length > 0 && (
          <label className="field">
            <span className="label">Which part</span>
            <select value={track} onChange={e => setTrack(e.target.value)}>
              {tracks.map(t => <option key={t.id} value={t.id}>{t.group ? `${t.group} · ` : ''}{t.name}</option>)}
            </select>
          </label>
        )}
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
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={PROMPT[area]} style={{ minHeight: 80 }} autoFocus={!timed} />
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
export function LogList({ area, days, track, empty }: { area: AreaId; days: string[]; track?: string; empty?: string }) {
  useStore()
  const rows = days.flatMap(d => logsFor(area, d, track).map(l => ({ ...l, d }))).reverse()
  if (!rows.length) return <p className="empty">{empty ?? 'Nothing logged yet.'}</p>
  return (
    <ul className="list">
      {rows.slice(0, 40).map(l => (
        <li key={l.id}>
          <div style={{ padding: '8px 0' }}>
            <div className="row small">
              <span className="mono dim">{nice(l.d)}</span>
              <span>{trackName(l.track)}</span>
              {l.mins > 0 && <span className="mono dim">{mins(l.mins)}</span>}
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

/* ---------- daily habits for an area ---------- */
export function Habits({ area, date }: { area: AreaId; date: string }) {
  const [done, setDone] = useDoc(K.habits(date), D.habits)
  const [, setCfg] = useDoc(K.config, DEFAULT_CONFIG)
  const [v, setV] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)
  const hs = config().habits.filter(h => h.area === area)
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
        setCfg(c => { c.habits = [...config().habits, { id: uid(), area, name: v.trim() }] })
        setV('')
      }}>
        <input type="text" style={{ flex: 1 }} value={v} onChange={e => setV(e.target.value)} placeholder="Add a daily habit" aria-label="Add a daily habit" maxLength={120} />
        <button className="btn">Add</button>
      </form>
    </div>
  )
}
