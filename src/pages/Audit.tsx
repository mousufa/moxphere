import { useState } from 'react'
import { AREAS, D, K, STUDY_GROUPS } from '../lib/model'
import { mins, shift, today, weekDays, weekLabel, weekStart } from '../lib/date'
import { get, useDoc, useStore } from '../lib/store'
import { activeDays, drainMins, focusMins, logsFor, minutes, prayed, sumDays, tracksOf } from '../lib/stats'
import { Bars, PH, Sec, Tiles } from '../ui/bits'

const QUESTIONS: [string, string][] = [
  ['forward', 'What moved me forward this week?'],
  ['proud', 'What am I proud of?'],
  ['drain', 'What drained me, and what will I cut?'],
  ['mine', "Did I take on someone else's definition of me? What is actually true?"],
  ['leftout', 'Did I feel left out anywhere? What did I do, and what will I do next time?'],
  ['next', 'My focus for next week'],
]

export default function Audit() {
  useStore()
  const [wk, setWk] = useState(weekStart(today()))
  const [audit, setAudit] = useDoc(K.audit(wk), D.audit)
  const t = today()
  const days = weekDays(wk).filter(d => d <= t)
  const prev = weekDays(shift(wk, -7))
  const isNow = wk === weekStart(t)
  const n = Math.max(1, days.length)

  const per = AREAS.map(a => ({ ...a, active: activeDays(a.id, days), now: sumDays(days, d => minutes(a.id, d)), before: sumDays(prev, d => minutes(a.id, d)) }))
  const quiet = per.filter(a => a.active === 0)
  const focus = sumDays(days, focusMins), drain = sumDays(days, drainMins)
  const h = (d: string) => get(K.health(d), D.health)
  const avg = (f: (d: string) => number | undefined) => {
    const v = days.map(f).filter((x): x is number => x != null)
    return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : '–'
  }
  const ratings = Object.values(get(K.ratings(wk), D.ratings).r)
  const income = tracksOf('hustles').reduce((a, tr) =>
    a + get(K.hustle(tr.id), D.hustle).money.filter(m => days.includes(m.date)).reduce((s, m) => s + (m.kind === 'in' ? m.amt : -m.amt), 0), 0)
  const studyGroup = (g: string) => tracksOf('study').filter(tr => tr.group === g).reduce((a, tr) => a + sumDays(days, d => minutes('study', d, tr.id)), 0)
  const maxStudy = Math.max(30, ...STUDY_GROUPS.map(studyGroup))

  return (
    <div className="stack">
      <PH title="Audit" sub={`Week of ${weekLabel(wk)}`} right={
        <div className="row">
          <button className="btn" onClick={() => setWk(shift(wk, -7))} aria-label="Previous week">←</button>
          {!isNow && <button className="btn" onClick={() => setWk(weekStart(t))}>This week</button>}
          <button className="btn" disabled={isNow} onClick={() => setWk(shift(wk, 7))} aria-label="Next week">→</button>
        </div>
      } />
      <Tiles four items={[
        { label: 'Focused', value: mins(focus), sub: 'study, work and more' },
        { label: 'Drained', value: mins(drain), sub: focus + drain ? `${Math.round((drain / (focus + drain)) * 100)}% of tracked time` : 'nothing tracked' },
        { label: 'Prayers on time', value: `${sumDays(days, d => prayed(d).onTime)}/${days.length * 5}` },
        { label: 'Net from hustles', value: '₹' + Math.round(income).toLocaleString('en-IN') },
      ]} />
      <div className="cols">
        <div className="stack">
          <Sec title="Balance" sub="Days you looked after each area">
            <Bars rows={per.map(a => ({ key: a.id, name: a.name, v: a.active, max: n, href: '#' + a.id, val: `${a.active}/${days.length}`, flag: a.active === 0 ? 'Nothing' : undefined }))} />
            {quiet.length > 0 && <p className="small">Nothing yet for {quiet.map(a => a.name).join(', ')}. Pick one small thing for each.</p>}
          </Sec>
          <Sec title="Time by area" sub="Minutes logged, this week against last week">
            <ul className="list">
              {per.filter(a => a.now || a.before).map(a => (
                <li key={a.id}>
                  <span style={{ padding: '8px 0' }}>{a.name}</span>
                  <span className="mono" style={{ padding: '8px 0', flex: 'none' }}>
                    {mins(a.now)} <span className="dim small">{a.before ? `${a.now >= a.before ? '+' : '−'}${mins(Math.abs(a.now - a.before))} vs last week` : 'new'}</span>
                  </span>
                </li>
              ))}
              {!per.some(a => a.now || a.before) && <li><span className="empty" style={{ padding: '8px 0' }}>No time logged yet. Use Log it or Focus.</span></li>}
            </ul>
          </Sec>
          <Sec title="Study mix">
            <Bars rows={STUDY_GROUPS.map(g => ({ key: g, name: g, v: studyGroup(g), max: maxStudy, val: mins(studyGroup(g)) }))} />
          </Sec>
          <Sec title="Body, people and you">
            <Tiles items={[
              { label: 'Sleep avg', value: avg(d => h(d).sleep) + 'h' },
              { label: 'Water avg', value: avg(d => h(d).water), sub: 'glasses' },
              { label: 'Mood avg', value: avg(d => h(d).mood), sub: 'out of 5' },
              { label: 'Energy avg', value: avg(d => h(d).energy), sub: 'out of 5' },
              { label: 'Social moments', value: sumDays(days, d => logsFor('social', d).length) },
              { label: 'Self rating', value: ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '–', sub: 'social, out of 5' },
              { label: 'Self care', value: sumDays(days, d => logsFor('selfcare', d).length), sub: 'times' },
              { label: 'Quran', value: sumDays(days, d => get(K.akhira(d), D.akhira).quran || 0), sub: 'pages' },
            ]} />
          </Sec>
        </div>
        <div className="stack">
          <Sec title="Reflect" sub="Answer in your own words. This is how you define yourself.">
            {QUESTIONS.map(([k, q]) => (
              <label key={k} className="field">
                <span>{q}</span>
                <textarea value={audit.answers[k] || ''} style={{ minHeight: 80 }}
                  onChange={e => { const v = e.target.value; setAudit(a => { a.answers = { ...a.answers, [k]: v } }) }} />
              </label>
            ))}
          </Sec>
        </div>
      </div>
    </div>
  )
}
