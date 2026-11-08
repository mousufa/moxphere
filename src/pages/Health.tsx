import { useState } from 'react'
import { AREAS, D, K } from '../lib/model'
import { lastDays, mins, nice, today } from '../lib/date'
import { get, useDoc, useStore } from '../lib/store'
import { score, streak } from '../lib/stats'
import { DateNav, DayCols, Heat, PH, Sec, Seg, Stepper, Tiles } from '../ui/bits'
import { Habits, LogList, openLog } from '../ui/logs'

const avg = (xs: (number | undefined)[]) => {
  const v = xs.filter((x): x is number => x != null)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}
const h = (d: string) => get(K.health(d), D.health)

export default function Health() {
  useStore()
  const [date, setDate] = useState(today())
  const [hd, setH] = useDoc(K.health(date), D.health)
  const week = lastDays(7)
  const sleep = avg(week.map(d => h(d).sleep))
  const water = avg(week.map(d => h(d).water))
  const move = week.reduce((a, d) => a + (h(d).move || 0), 0)
  const scale = [1, 2, 3, 4, 5].map(v => ({ v, t: String(v) }))
  return (
    <div className="stack">
      <PH title="Health" sub={AREAS[0].sub} right={<button className="btn primary" onClick={() => openLog({ area: 'health', track: 'exercise', date })}>Log exercise</button>} />
      <Tiles four items={[
        { label: 'Sleep, 7 day avg', value: sleep == null ? '–' : `${sleep.toFixed(1)}h` },
        { label: 'Water, 7 day avg', value: water == null ? '–' : `${water.toFixed(1)}` , sub: 'glasses' },
        { label: 'Moved, 7 days', value: mins(move) },
        { label: 'Streak', value: `${streak('health')}d`, sub: 'days with a check-in' },
      ]} />
      <div className="cols">
        <div className="stack">
          <DateNav date={date} setDate={setDate} />
          <Sec title="Check in">
            <div className="row between"><span>Sleep</span><Stepper label="sleep" unit="h" step={0.5} max={16} value={hd.sleep} onChange={v => setH(x => { x.sleep = v })} /></div>
            <div className="row between"><span>Water (glasses)</span><Stepper label="water" max={30} value={hd.water} onChange={v => setH(x => { x.water = v })} /></div>
            <div className="row between"><span>Movement (minutes)</span><Stepper label="movement" step={10} max={600} value={hd.move} onChange={v => setH(x => { x.move = v })} /></div>
            <div className="row between"><span>Mood</span><Seg label="Mood" value={hd.mood} options={scale} onChange={v => setH(x => { x.mood = v })} /></div>
            <div className="row between"><span>Energy</span><Seg label="Energy" value={hd.energy} options={scale} onChange={v => setH(x => { x.energy = v })} /></div>
            <p className="small mute">1 is low, 5 is great.</p>
          </Sec>
          <Sec title="Daily habits"><Habits area="health" date={date} /></Sec>
          <Sec title="Exercise log"><LogList area="health" days={lastDays(60)} empty="No exercise logged in the last 60 days." /></Sec>
        </div>
        <div className="stack">
          <Sec title="Sleep" sub="Hours, last 14 days"><DayCols value={d => h(d).sleep} fmt={v => `${v}h`} max={10} /></Sec>
          <Sec title="Water" sub="Glasses, last 14 days"><DayCols value={d => h(d).water} fmt={v => `${v} glasses`} /></Sec>
          <Sec title="Movement" sub="Minutes, last 14 days"><DayCols value={d => h(d).move} fmt={v => mins(v)} /></Sec>
          <Sec title="Mood and energy" sub="Last 14 days">
            <MoodRow label="Mood" get={d => h(d).mood} />
            <MoodRow label="Energy" get={d => h(d).energy} />
          </Sec>
          <Sec title="Consistency"><Heat value={d => score('health', d)} label={(d, v) => `${nice(d)} · ${v} things`} /></Sec>
        </div>
      </div>
    </div>
  )
}

function MoodRow({ label, get: g }: { label: string; get: (d: string) => number | undefined }) {
  const days = lastDays(14)
  return (
    <div className="row between">
      <span className="small">{label}</span>
      <span className="row" style={{ gap: 3 }}>
        {days.map(d => {
          const v = g(d)
          return (
            <span key={d} title={`${nice(d)}: ${v ?? 'not logged'}`} className="mono"
              style={{ width: 18, textAlign: 'center', fontSize: 13, color: v ? 'var(--fg)' : 'var(--mute)', borderBottom: `${v ? v : 0}px solid var(--fg)` }}>
              {v ?? '·'}
            </span>
          )
        })}
      </span>
    </div>
  )
}
