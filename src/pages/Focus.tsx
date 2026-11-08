import { AREAS, type AreaId } from '../lib/model'
import { mins, today } from '../lib/date'
import { useStore } from '../lib/store'
import { logsOn, trackName, tracksOf } from '../lib/stats'
import { active, choose, clock, pause, planned, remaining, reset, start, useTimer } from '../lib/timer'
import { PH, Sec } from '../ui/bits'

export default function Focus() {
  useStore()
  const t = useTimer()
  const on = active(t)
  const left = remaining(t)
  const C = 2 * Math.PI * 90
  const tracks = tracksOf(t.area)
  const sessions = logsOn(today()).filter(l => l.note === 'Focus session')
  return (
    <div className="stack">
      <PH title="Focus" sub="One thing at a time. Finished sessions are logged for you." />
      <div className="cols">
        <div className="box strong" style={{ display: 'grid', gap: 18, justifyItems: 'center', padding: '28px 16px' }}>
          <div className="row" style={{ justifyContent: 'center' }}>
            <select value={t.area} disabled={on} aria-label="Area" style={{ width: 'auto' }}
              onChange={e => { const a = e.target.value as AreaId; choose({ area: a, track: tracksOf(a)[0]?.id ?? 'general' }) }}>
              {AREAS.filter(a => a.id !== 'akhira').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {tracks.length > 0 && (
              <select value={t.track} disabled={on} aria-label="What you're working on" style={{ width: 'auto', maxWidth: '100%' }} onChange={e => choose({ track: e.target.value })}>
                {tracks.map(tr => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
              </select>
            )}
          </div>
          <div className="ring">
            <svg viewBox="0 0 200 200" aria-hidden="true">
              <circle className="tr" cx="100" cy="100" r="90" />
              <circle className="pr" cx="100" cy="100" r="90" strokeDasharray={C} strokeDashoffset={on ? C * (1 - Math.max(0, left) / planned(t)) : 0} />
            </svg>
            <div>
              <span className="digits" role="timer">{clock(left)}</span>
              <span className="label">{t.mode === 'focus' ? trackName(t.track) : 'Break'}</span>
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
              {sessions.map(s => (
                <li key={s.id}><span style={{ padding: '8px 0' }}>{trackName(s.track)} <span className="mono dim">{mins(s.mins)}</span></span></li>
              ))}
            </ul>
          ) : <p className="empty">No sessions yet today.</p>}
        </Sec>
      </div>
    </div>
  )
}
