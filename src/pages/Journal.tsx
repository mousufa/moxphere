import { useState } from 'react'
import { K } from '../lib/model'
import { lastDays, longDate, nice, today } from '../lib/date'
import { get, useDoc, useStore } from '../lib/store'
import { DateNav, ListEditor, PH, Sec } from '../ui/bits'
import { Drains } from './Today'

const J = { text: '', wins: [] as string[] }

export default function Journal() {
  useStore()
  const [date, setDate] = useState(today())
  const [j, setJ] = useDoc(K.journal(date), J)
  const words = j.text.trim() ? j.text.trim().split(/\s+/).length : 0
  const past = lastDays(60).reverse().filter(d => d !== date && get(K.journal(d), J).text.trim())
  return (
    <div className="stack">
      <PH title="Journal" sub="Your words, your version of the day" />
      <div className="cols">
        <div className="stack">
          <DateNav date={date} setDate={setDate} />
          <label className="field">
            <span className="label">{longDate(date)} · {words} words</span>
            <textarea className="big" value={j.text} placeholder="What happened, how you felt, what you want to remember"
              onChange={e => { const v = e.target.value; setJ(x => { x.text = v }) }} />
          </label>
        </div>
        <div className="stack">
          <Sec title="Wins" sub="Small or big. Proof of who you are becoming.">
            <ListEditor items={j.wins || []} onChange={w => setJ(x => { x.wins = w })} placeholder="Explained a case clearly in class" label="Add a win" />
          </Sec>
          <Drains date={date} />
          <Sec title="Earlier entries">
            {past.length ? (
              <ul className="list">
                {past.slice(0, 20).map(d => (
                  <li key={d}>
                    <button className="link" style={{ textAlign: 'left', textDecoration: 'none', color: 'var(--fg)', padding: '8px 0' }} onClick={() => { setDate(d); window.scrollTo(0, 0) }}>
                      <span className="mono small dim">{nice(d)}</span>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{get(K.journal(d), J).text.slice(0, 120)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="empty">Entries you write will be listed here.</p>}
          </Sec>
        </div>
      </div>
    </div>
  )
}
