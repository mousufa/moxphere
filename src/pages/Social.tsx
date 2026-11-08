import { useState } from 'react'
import { D, K } from '../lib/model'
import { daysBetween, lastDays, nice, shift, today, uid, weekDays, weekStart } from '../lib/date'
import { get, useDoc, useStore } from '../lib/store'
import { logsFor, score, sumDays, tracksOf } from '../lib/stats'
import { Heat, PH, Sec, Seg, Tiles } from '../ui/bits'
import { LogList, openLog } from '../ui/logs'

export default function Social() {
  useStore()
  const t = today()
  const wk = weekStart(t)
  const days = weekDays(t).filter(d => d <= t)
  const skills = tracksOf('social')
  const [rate, setRate] = useDoc(K.ratings(wk), D.ratings)
  const weeks = Array.from({ length: 8 }, (_, i) => shift(wk, -7 * (7 - i)))
  const rated = Object.values(rate.r)
  const [people] = useDoc(K.people, D.people)
  const talked = people.items.filter(p => p.last && daysBetween(p.last, t) < 30).length
  return (
    <div className="stack">
      <PH title="Social self" sub="Communication, articulation, connections, expressing yourself, emotional control, clarity and confidence"
        right={<button className="btn primary" onClick={() => openLog({ area: 'social' })}>Log a moment</button>} />
      <Tiles four items={[
        { label: 'Moments this week', value: sumDays(days, d => logsFor('social', d).length) },
        { label: 'Your rating this week', value: rated.length ? (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1) : '–', sub: 'average, out of 5' },
        { label: 'People, last 30 days', value: talked, sub: `of ${people.items.length} you track` },
        { label: 'Active days', value: `${days.filter(d => score('social', d) > 0).length}/${days.length}` },
      ]} />
      <div className="cols">
        <div className="stack">
          <Sec title="How I showed up this week" sub="Rate yourself by your own standard. 1 is rough, 5 is your best self.">
            <ul className="list">
              {skills.map(s => (
                <li key={s.id} style={{ flexWrap: 'wrap', alignItems: 'center', gap: '6px 12px', padding: '8px 0' }}>
                  <div style={{ minWidth: 160 }}>
                    <div>{s.name}</div>
                    <div className="dots" title="Your rating, last 8 weeks" aria-label={`${s.name}, last 8 weeks`}>
                      {weeks.map(w => {
                        const v = get(K.ratings(w), D.ratings).r[s.id]
                        return <i key={w} className={v >= 4 ? 'on' : v ? 'half' : ''} title={`${nice(w, { day: 'numeric', month: 'short' })}: ${v ?? 'not rated'}`} />
                      })}
                    </div>
                  </div>
                  <span className="row" style={{ flex: 'none', gap: 6 }}>
                    <Seg label={`Rate ${s.name}`} value={rate.r[s.id]} options={[1, 2, 3, 4, 5].map(v => ({ v, t: String(v) }))}
                      onChange={v => setRate(x => { if (v == null) delete x.r[s.id]; else x.r[s.id] = v })} />
                    <button className="btn small" onClick={() => openLog({ area: 'social', track: s.id })}>+ moment</button>
                  </span>
                </li>
              ))}
            </ul>
            <p className="small mute">Squares: white is 4 or 5, grey is 1 to 3, empty is not rated.</p>
          </Sec>
          <Sec title="Moments" sub="Times you spoke up, stayed calm, said it clearly or made a connection">
            <LogList area="social" days={lastDays(30)} empty="Log a moment when you handle a conversation the way you want to." />
          </Sec>
        </div>
        <div className="stack">
          <People />
          <Sec title="Consistency"><Heat value={d => score('social', d)} label={(d, v) => `${nice(d)} · ${v} moments`} /></Sec>
        </div>
      </div>
    </div>
  )
}

function People() {
  const [p, setP] = useDoc(K.people, D.people)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const t = today()
  const sorted = [...p.items].sort((a, b) => (a.last || '0').localeCompare(b.last || '0'))
  return (
    <Sec title="People" sub="Who you want to stay close to. The longest since you talked comes first.">
      {sorted.length ? (
        <ul className="list">
          {sorted.map(x => {
            const ago = x.last ? daysBetween(x.last, t) : null
            return (
              <li key={x.id} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ padding: '8px 0' }}>
                  <div>{x.name} {ago != null && ago >= 30 && <span className="flag">{ago} days</span>}</div>
                  <div className="small dim">{x.note}{x.note ? ' · ' : ''}{ago == null ? 'not yet' : ago === 0 ? 'talked today' : `last talked ${nice(x.last)}`}</div>
                </div>
                <span className="row" style={{ flex: 'none', gap: 4 }}>
                  <button className="btn small" onClick={() => setP(d => { const it = d.items.find(i => i.id === x.id); if (it) it.last = t })}>Talked today</button>
                  <button className="x" aria-label={`Remove ${x.name}`} onClick={() => setP(d => { d.items = d.items.filter(i => i.id !== x.id) })}>×</button>
                </span>
              </li>
            )
          })}
        </ul>
      ) : <p className="empty">Add friends, mentors and people in pharma you want to keep in touch with.</p>}
      <form className="form" onSubmit={e => {
        e.preventDefault()
        if (!name.trim()) return
        setP(d => { d.items.push({ id: uid(), name: name.trim(), note: note.trim(), last: '' }) })
        setName('')
        setNote('')
      }}>
        <label className="field"><span className="label">Name</span><input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={60} /></label>
        <label className="field"><span className="label">Who they are</span><input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Senior in CDM" maxLength={80} /></label>
        <button className="btn">Add</button>
      </form>
    </Sec>
  )
}
