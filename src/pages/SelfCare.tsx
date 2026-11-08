import { useState } from 'react'
import { DEFAULT_CONFIG, K } from '../lib/model'
import { lastDays, nice, today, uid } from '../lib/date'
import { useDoc, useStore } from '../lib/store'
import { config, daysSince, logsFor, score, sumDays, tracksOf } from '../lib/stats'
import { Heat, ListEditor, PH, Sec, Tiles } from '../ui/bits'
import { LogList, openLog } from '../ui/logs'

export default function SelfCare() {
  useStore()
  const month = lastDays(30)
  const types = tracksOf('selfcare')
  const [ideas, setIdeas] = useDoc('selfcare/ideas', { items: [] as string[] })
  const [, setCfg] = useDoc(K.config, DEFAULT_CONFIG)
  const [v, setV] = useState('')
  const since = daysSince('selfcare')
  return (
    <div className="stack">
      <PH title="Self care" sub="Small trips, cooking, food hunts, creating something. Time that is just for you."
        right={<button className="btn primary" onClick={() => openLog({ area: 'selfcare' })}>Log it</button>} />
      <Tiles four items={[
        { label: 'Last 30 days', value: sumDays(month, d => logsFor('selfcare', d).length), sub: 'times' },
        { label: 'Last time', value: since == null ? '–' : since === 0 ? 'Today' : `${since}d ago` },
        ...types.slice(0, 2).map(tp => ({ label: tp.name, value: sumDays(month, d => logsFor('selfcare', d, tp.id).length), sub: 'in 30 days' })),
      ]} />
      <div className="cols">
        <div className="stack">
          <Sec title="What you've done">
            <div className="bars">
              {types.map(tp => {
                const n = sumDays(month, d => logsFor('selfcare', d, tp.id).length)
                const s = daysSince('selfcare', tp.id)
                return (
                  <div key={tp.id} className="bar">
                    <span className="name">{tp.name}</span>
                    <span className="mono small dim">{n} in 30 days · {s == null ? 'not yet' : s === 0 ? 'today' : `${s}d ago`}</span>
                    <button className="btn small" onClick={() => openLog({ area: 'selfcare', track: tp.id })}>Log</button>
                  </div>
                )
              })}
            </div>
            <form className="row" onSubmit={e => {
              e.preventDefault()
              if (!v.trim()) return
              setCfg(c => { c.tracks = [...config().tracks, { id: uid(), area: 'selfcare', name: v.trim() }] })
              setV('')
            }}>
              <input type="text" style={{ flex: 1 }} value={v} onChange={e => setV(e.target.value)} placeholder="Add another kind, like reading or a movie" aria-label="Add a kind of self care" maxLength={60} />
              <button className="btn">Add</button>
            </form>
          </Sec>
          <Sec title="Log"><LogList area="selfcare" days={lastDays(90)} empty="Nothing in the last 90 days. Plan something small for this week." /></Sec>
        </div>
        <div className="stack">
          <Sec title="Wish list" sub="Places to go, food to try, things to make">
            <ListEditor items={ideas.items} onChange={items => setIdeas(x => { x.items = items })} placeholder="Sunset at Kappad beach" label="Add an idea" />
          </Sec>
          <Sec title="Consistency"><Heat value={d => score('selfcare', d) * 2} label={(d) => `${nice(d)} · ${logsFor('selfcare', d).length} times`} /></Sec>
          <p className="small mute">Today is {nice(today())}.</p>
        </div>
      </div>
    </div>
  )
}
