import { useState } from 'react'
import { D, K, PRAYERS, type PrayerState } from '../lib/model'
import { longDate, mins, today, uid } from '../lib/date'
import { useDoc, useStore } from '../lib/store'
import { balance, config, drainMins, focusMins, logsFor } from '../lib/stats'
import { Bars, PH, Sec, Seg, Stepper, Tiles, useToday } from '../ui/bits'
import { Plan } from '../ui/plan'
import { openLog } from '../ui/logs'

export default function Today() {
  useStore()
  const d = useToday()
  const [health, setHealth] = useDoc(K.health(d), D.health)
  const [ak, setAk] = useDoc(K.akhira(d), D.akhira)
  const bal = balance(d)
  const r = config().reminder
  const now = new Date()
  const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const [snoozed, setSnoozed] = useState(() => localStorage.getItem('moxphere:snooze') === d)
  const studyDue = r.on && hm >= r.time && !logsFor('study', d).length && !snoozed

  return (
    <div className="stack">
      <PH title="Baa plan cheyyam" sub={longDate(d)} right={
        <div className="row">
          <button className="btn primary" onClick={() => openLog({ area: 'study' })}>Log it</button>
          <a className="btn" href="#focus">Focus</a>
        </div>
      } />
      {studyDue && (
        <div className="nudge" role="status">
          <strong>Baa korach padikkam</strong>
          <a className="btn primary" href="#study">Open study</a>
          <button className="btn" onClick={() => { localStorage.setItem('moxphere:snooze', d); setSnoozed(true) }}>Later</button>
        </div>
      )}
      <div className="cols">
        <div className="stack">
          <Sec title="Hour by hour"><Plan date={d} /></Sec>
        </div>
        <div className="stack first-on-phone">
          <Sec title="This week" sub="Days you looked after each part of your life">
            <Bars rows={bal.map(a => ({
              key: a.id, name: a.name, v: a.active, max: 7, href: '#' + a.id,
              val: `${a.active}/${a.days} days`,
              flag: a.since == null ? 'Not started' : a.since >= 4 ? `${a.since} days ago` : undefined,
            }))} />
          </Sec>
          <Tiles items={[
            { label: 'Focused today', value: mins(focusMins(d)) },
            { label: 'Drained today', value: mins(drainMins(d)), sub: 'Time on zero-return things' },
          ]} />
          <Sec title="Check in">
            <div className="row between"><span>Sleep</span><Stepper label="sleep" unit="h" step={0.5} max={16} value={health.sleep} onChange={v => setHealth(h => { h.sleep = v })} /></div>
            <div className="row between"><span>Water</span><Stepper label="glasses of water" step={1} max={30} value={health.water} onChange={v => setHealth(h => { h.water = v })} /></div>
            <div className="row between"><span>Mood</span><Seg label="Mood" value={health.mood} options={[1, 2, 3, 4, 5].map(v => ({ v, t: String(v) }))} onChange={v => setHealth(h => { h.mood = v })} /></div>
            <div className="row between"><span>Energy</span><Seg label="Energy" value={health.energy} options={[1, 2, 3, 4, 5].map(v => ({ v, t: String(v) }))} onChange={v => setHealth(h => { h.energy = v })} /></div>
            <div className="sec" style={{ gap: 6 }}>
              <span>Prayers on time</span>
              <div className="seg" role="group" aria-label="Prayers">
                {PRAYERS.map(([k, name]) => {
                  const st = ak.p?.[k]
                  const next: Record<string, PrayerState | undefined> = { undefined: 'on', on: 'late', late: undefined }
                  return (
                    <button key={k} aria-pressed={st === 'on'} title={st === 'late' ? 'Prayed late' : st === 'on' ? 'On time' : 'Not marked'}
                      onClick={() => setAk(a => { a.p = a.p || {}; const n = next[String(st)]; if (n) a.p[k] = n; else delete a.p[k] })}
                      style={st === 'late' ? { borderColor: 'var(--fg)' } : undefined}>
                      {name}{st === 'late' ? ' · late' : ''}
                    </button>
                  )
                })}
              </div>
              <p className="small mute">Tap once for on time, again for late, again to clear.</p>
            </div>
          </Sec>
          <Drains date={d} />
        </div>
      </div>
    </div>
  )
}

export function Drains({ date }: { date: string }) {
  const [dr, setDr] = useDoc(K.drains(date), D.drains)
  const [what, setWhat] = useState('')
  const [m, setM] = useState('')
  return (
    <Sec title="Zero-return time" sub="Scrolling, overthinking, negative talk. Name it so you can cut it.">
      {dr.items.length > 0 && (
        <ul className="list">
          {dr.items.map(x => (
            <li key={x.id}>
              <span style={{ padding: '8px 0' }}>{x.what} <span className="mono dim">{mins(x.mins)}</span></span>
              <button className="x" aria-label={`Remove ${x.what}`} onClick={() => setDr(v => { v.items = v.items.filter(i => i.id !== x.id) })}>×</button>
            </li>
          ))}
        </ul>
      )}
      <form className="form" onSubmit={e => {
        e.preventDefault()
        const n = Math.round(Number(m) || 0)
        if (!what.trim() || !n) return
        setDr(v => { v.items.push({ id: uid(), what: what.trim(), mins: n }) })
        setWhat('')
        setM('')
      }}>
        <label className="field"><span className="label">What</span><input type="text" value={what} onChange={e => setWhat(e.target.value)} placeholder="Reels" maxLength={120} /></label>
        <label className="field" style={{ flex: '0 1 100px' }}><span className="label">Minutes</span><input type="number" inputMode="numeric" min={1} value={m} onChange={e => setM(e.target.value)} placeholder="40" /></label>
        <button className="btn">Add</button>
      </form>
      {date !== today() && <p className="small mute">For {longDate(date)}</p>}
    </Sec>
  )
}
