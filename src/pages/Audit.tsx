import { useState } from 'react'
import { BRANCHES, D, K, LIFE } from '../lib/model'
import { mins, shift, today, weekDays, weekLabel, weekStart } from '../lib/date'
import { get, useDoc, useStore } from '../lib/store'
import { activeDays, akhiraDay, drainMins, focusMins, logsOn, minutes, prayed, score, sumDays } from '../lib/stats'
import { Bars, PH, Sec, Tiles } from '../ui/bits'

const QUESTIONS: [string, string][] = [
  ['forward', 'What moved me forward this week?'],
  ['proud', 'What am I proud of?'],
  ['drain', 'What drained me, and what will I cut?'],
  ['mine', "Did I take on someone else's definition of me? What is actually true?"],
  ['leftout', 'Did I feel left out anywhere? What did I do, and what will I do next time?'],
  ['control', 'Where did I stay in control of myself, and where did I slip?'],
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

  const per = LIFE.map(b => ({ id: b.id, name: b.name, active: activeDays(b.id, days), now: sumDays(days, d => minutes(b.id, d)), before: sumDays(prev, d => minutes(b.id, d)) }))
  const quiet = per.filter(a => a.active === 0)
  const focus = sumDays(days, focusMins), drain = sumDays(days, drainMins)
  const learning = BRANCHES.find(b => b.id === 'learning')!
  const groups = ['University', 'Exams', 'Tech']
  const groupMins = (g: string) => learning.leaves.filter(l => l.group === g).reduce((a, l) => a + sumDays(days, d => minutes('learning', d, l.id)), 0)
  const maxG = Math.max(30, ...groups.map(groupMins))
  const money = ['pinned', 'whypharm', 'yt', 'tutoring'].reduce((a, id) =>
    a + get(K.leaf(id), D.leaf).money.filter(m => days.includes(m.date)).reduce((s, m) => s + (m.kind === 'in' ? m.amt : -m.amt), 0), 0)
  const h = (d: string) => get(K.health(d), D.health)
  const avg = (f: (d: string) => number | undefined) => {
    const v = days.map(f).filter((x): x is number => x != null)
    return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : '–'
  }
  const ratings = Object.values(get(K.ratings(wk), D.ratings).r)
  const count = (area: string) => sumDays(days, d => logsOn(d).filter(l => l.area === area).length)
  const updates = get(K.leaf('forecast'), D.leaf).updates.filter(u => days.includes(u.date)).length

  return (
    <div className="stack">
      <PH title="Weekly audit" sub={`Week of ${weekLabel(wk)}`} right={
        <div className="row">
          <button className="btn" onClick={() => setWk(shift(wk, -7))} aria-label="Previous week">←</button>
          {!isNow && <button className="btn" onClick={() => setWk(weekStart(t))}>This week</button>}
          <button className="btn" disabled={isNow} onClick={() => setWk(shift(wk, 7))} aria-label="Next week">→</button>
        </div>
      } />
      <Tiles four items={[
        { label: 'Focused', value: mins(focus) },
        { label: 'Drained', value: mins(drain), sub: focus + drain ? `${Math.round((drain / (focus + drain)) * 100)}% of tracked time` : 'nothing tracked' },
        { label: 'Prayers on time', value: `${sumDays(days, d => prayed(d).onTime)}/${days.length * 5}` },
        { label: 'Net from building', value: '₹' + Math.round(money).toLocaleString('en-IN') },
      ]} />
      <div className="cols">
        <div className="stack">
          <Sec title="Balance" sub="Days you looked after each branch">
            <Bars rows={per.map(a => ({ key: a.id, name: a.name, v: a.active, max: n, href: '#home/' + a.id, val: `${a.active}/${days.length}`, flag: a.active === 0 ? 'Nothing' : undefined }))} />
            {quiet.length > 0 && <p className="small">Nothing yet for {quiet.map(a => a.name).join(', ')}. Pick one small thing for each.</p>}
          </Sec>
          <Sec title="Time by branch" sub="Minutes logged, this week against last week">
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
          <Sec title="Learning mix">
            <Bars rows={groups.map(g => ({ key: g, name: g, v: groupMins(g), max: maxG, val: mins(groupMins(g)) }))} />
          </Sec>
          <Sec title="Everything else">
            <Tiles items={[
              { label: 'Project updates', value: updates },
              { label: 'Research time', value: mins(sumDays(days, d => minutes('research', d))) },
              { label: 'Career time', value: mins(sumDays(days, d => minutes('career', d))) },
              { label: 'Quran', value: sumDays(days, d => akhiraDay(d).quran || 0), sub: 'pages' },
              { label: 'Self rating', value: ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '–', sub: 'out of 5' },
              { label: 'Practice moments', value: count('self') },
              { label: 'Things I love', value: count('joy'), sub: 'times' },
              { label: 'Akhira days', value: `${days.filter(d => score('akhira', d) > 0).length}/${days.length}` },
              { label: 'Sleep avg', value: avg(d => h(d).sleep) + 'h' },
              { label: 'Mood avg', value: avg(d => h(d).mood), sub: 'out of 5' },
            ]} />
          </Sec>
        </div>
        <div className="stack">
          <Sec title="Reflect" sub="Answer in your own words. This is how you define yourself.">
            {QUESTIONS.map(([k, q]) => (
              <label key={k} className="field">
                <span style={{ fontWeight: 600 }}>{q}</span>
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
