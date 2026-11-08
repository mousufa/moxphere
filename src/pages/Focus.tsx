import { useEffect } from 'react'
import { LOGGABLE } from '../lib/model'
import { mins, today } from '../lib/date'
import { useStore } from '../lib/store'
import { branch, branches, leafName, logsOn } from '../lib/stats'
import { active, choose, clock, pause, planned, remaining, reset, start, useTimer } from '../lib/timer'
import { PH, Sec } from '../ui/bits'

const focusBranches = () => branches().filter(b => b.leaves.some(l => LOGGABLE.includes(l.kind)))
const leavesOf = (id: string) => (branch(id)?.leaves ?? []).filter(l => LOGGABLE.includes(l.kind))

export default function Focus() {
  useStore()
  const t = useTimer()
  const on = active(t)
  const left = remaining(t)
  const C = 2 * Math.PI * 90
  const area = branch(t.area) ? t.area : 'learning'
  const leaves = leavesOf(area)
  const track = leaves.some(l => l.id === t.track) ? t.track : leaves[0]?.id
  useEffect(() => {
    if (!on && (area !== t.area || track !== t.track)) choose({ area, track })
  }, [on, area, track, t.area, t.track])
  const sessions = logsOn(today()).filter(l => l.note === 'Focus session')
  return (
    <div className="stack">
      <PH title="Focus timer" sub="One thing at a time. Finished sessions are logged for you." />
      <div className="cols">
        <div className="box" style={{ display: 'grid', gap: 18, justifyItems: 'center', padding: '28px 16px' }}>
          <div className="row" style={{ justifyContent: 'center' }}>
            <select value={area} disabled={on} aria-label="Branch" style={{ width: 'auto' }}
              onChange={e => choose({ area: e.target.value, track: leavesOf(e.target.value)[0]?.id ?? 'general' })}>
              {focusBranches().map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={track} disabled={on} aria-label="What you're working on" style={{ width: 'auto', maxWidth: '100%' }} onChange={e => choose({ track: e.target.value })}>
              {leaves.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="ring">
            <svg viewBox="0 0 200 200" aria-hidden="true">
              <circle className="tr" cx="100" cy="100" r="90" />
              <circle className="pr" cx="100" cy="100" r="90" strokeDasharray={C} strokeDashoffset={on ? C * (1 - Math.max(0, left) / planned(t)) : 0} />
            </svg>
            <div>
              <span className="digits" role="timer">{clock(left)}</span>
              <span className="label">{t.mode === 'focus' ? leafName(t.track) : 'Break'}</span>
            </div>
          </div>
          {t.mode === 'focus' && (
            <div className="seg" role="group" aria-label="Session length">
              {[15, 25, 45, 60, 90].map(m => <button key={m} disabled={on} aria-pressed={t.dur === m} onClick={() => choose({ dur: m })}>{m} min</button>)}
            </div>
          )}
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn primary" onClick={t.endsAt ? pause : start}>{t.endsAt ? 'Pause' : on ? 'Resume' : t.mode === 'focus' ? 'Start focus' : 'Start break'}</button>
            {(on || t.mode === 'break') && <button className="btn" onClick={reset}>{t.mode === 'break' ? 'Skip break' : 'Reset'}</button>}
          </div>
          <p className="small mute" style={{ textAlign: 'center', maxWidth: 360 }}>Keep the app open. Your phone may pause it in the background, and the session is still logged when you come back.</p>
        </div>
        <Sec title="Today's sessions" right={<span className="mono">{mins(sessions.reduce((a, s) => a + s.mins, 0))}</span>}>
          {sessions.length ? (
            <ul className="list">
              {sessions.map(s => <li key={s.id}><span style={{ padding: '8px 0' }}>{leafName(s.track)} <span className="dim">{mins(s.mins)}</span></span></li>)}
            </ul>
          ) : <p className="empty">No sessions yet today.</p>}
        </Sec>
      </div>
    </div>
  )
}
