import { D, K } from '../lib/model'
import { lastDays, mins, today, weekDays } from '../lib/date'
import { get, useDoc, useStore } from '../lib/store'
import { drainMins, focusMins, sumDays } from '../lib/stats'
import { DayCols, ListEditor, PH, Sec, Tiles } from '../ui/bits'
import { Drains as DrainLog } from './Today'

export default function Drains() {
  useStore()
  const t = today()
  const week = weekDays(t).filter(d => d <= t)
  const [me, setMe] = useDoc(K.me, D.me)
  const drained = sumDays(week, drainMins), focused = sumDays(week, focusMins)
  return (
    <div className="stack">
      <PH title="Zero-return time" sub="Scrolling, overthinking, negative talk. Name it, see it, cut it." />
      <Tiles four items={[
        { label: 'Today', value: mins(drainMins(t)) },
        { label: 'This week', value: mins(drained) },
        { label: 'Focused this week', value: mins(focused) },
        { label: 'Drained share', value: drained + focused ? `${Math.round((drained / (drained + focused)) * 100)}%` : '–', sub: 'of tracked time' },
      ]} />
      <div className="cols">
        <div className="stack">
          <DrainLog date={t} />
          <Sec title="Last 14 days" sub="Minutes drained per day"><DayCols value={drainMins} fmt={v => mins(v)} /></Sec>
        </div>
        <div className="stack">
          <Sec title="What I'm cutting" sub="Habits, places and conversations with zero return">
            <ListEditor items={me.noList} onChange={v => setMe(m => { m.noList = v })} placeholder="Scrolling after 11 PM" label="Add something to cut" />
          </Sec>
          <Sec title="Biggest drains, 30 days">
            <Top />
          </Sec>
        </div>
      </div>
    </div>
  )
}

function Top() {
  const totals = new Map<string, number>()
  for (const d of lastDays(30)) {
    for (const x of get(K.drains(d), D.drains).items) {
      const k = x.what.trim().toLowerCase()
      totals.set(k, (totals.get(k) ?? 0) + x.mins)
    }
  }
  const rows = [...totals].sort((a, b) => b[1] - a[1]).slice(0, 6)
  if (!rows.length) return <p className="empty">Nothing logged in the last 30 days.</p>
  return (
    <ul className="list">
      {rows.map(([k, v]) => <li key={k}><span style={{ padding: '8px 0', textTransform: 'capitalize' }}>{k}</span><span className="mono" style={{ padding: '8px 0' }}>{mins(v)}</span></li>)}
    </ul>
  )
}
