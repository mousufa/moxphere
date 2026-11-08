import { useState } from 'react'
import { D, DEFAULT_CONFIG, K, LOGGABLE, PRAYERS, VIDEO_STAGES, type Branch, type Leaf, type PrayerState } from '../lib/model'
import { isFriday, lastDays, longDate, mins, nice, shift, today, uid, weekDays, weekStart } from '../lib/date'
import { get, useDoc, useStore } from '../lib/store'
import { akhiraDay, config, daysSince, findLeaf, leafScore, logsOn, minutes, prayed, streakOf, sumDays } from '../lib/stats'
import { choose } from '../lib/timer'
import { Check, DateNav, DayCols, Heat, ListEditor, PH, Sec, Seg, Stepper, Tiles } from '../ui/bits'
import { Habits, LogList, openLog } from '../ui/logs'
import { Checklist, DrugDeck, ExamDate, MoneyLog, Notes, People, Pipeline, Tasks, Updates, inr } from '../ui/work'
import Health from './Health'

export default function LeafPage({ id }: { id: string }) {
  useStore()
  const found = findLeaf(id)
  if (!found) return <div className="stack"><PH title="Not found" sub="This part of the map no longer exists." /><a className="btn" href="#home">Go home</a></div>
  const { b, l } = found
  if (l.kind === 'health') return <Health />
  const Body = BODY[l.kind] ?? Activity
  const loggable = LOGGABLE.includes(l.kind)
  return (
    <div className="stack">
      <PH title={l.name} sub={`${b.name}${l.sub ? ' · ' + l.sub : ''}`} right={loggable && (
        <div className="row">
          <button className="btn primary" onClick={() => openLog({ area: b.id, track: l.id })}>{l.kind === 'skill' ? 'Log a moment' : 'Log it'}</button>
          {['learn', 'project', 'pipeline', 'career', 'service', 'product', 'channel', 'skill'].includes(l.kind) && (
            <button className="btn" onClick={() => { choose({ area: b.id, track: l.id }); location.hash = '#focus' }}>Focus on this</button>
          )}
        </div>
      )} />
      <Body b={b} l={l} />
      <RemoveLeaf b={b} l={l} />
    </div>
  )
}

type P = { b: Branch; l: Leaf }
const leafDays = (l: Leaf) => (d: string) => leafScore(l, d)

function TimeTiles({ b, l, extra = [] }: P & { extra?: { label: string; value: React.ReactNode; sub?: string }[] }) {
  const t = today()
  const week = weekDays(t).filter(d => d <= t)
  const since = daysSince(leafDays(l))
  return (
    <Tiles four items={[
      { label: 'Today', value: mins(minutes(b.id, t, l.id)) },
      { label: 'This week', value: mins(sumDays(week, d => minutes(b.id, d, l.id))) },
      { label: 'Last time', value: since == null ? '–' : since === 0 ? 'Today' : `${since}d ago` },
      ...extra,
    ].slice(0, 4)} />
  )
}

/* ---------- Learning ---------- */
function Learn({ b, l }: P) {
  const [doc, set] = useDoc(K.leaf(l.id), D.leaf)
  const topicsDone = doc.topics.filter(x => x.done).length
  const exam = l.group === 'University' || l.group === 'Exams'
  return (
    <>
      <TimeTiles b={b} l={l} extra={[{ label: 'Topics covered', value: doc.topics.length ? `${topicsDone}/${doc.topics.length}` : '–' }]} />
      <div className="cols">
        <div className="stack">
          {exam && <div className="box"><ExamDate doc={doc} set={set} /></div>}
          <Checklist items={doc.topics} onChange={v => set(x => { x.topics = v })}
            title={exam ? 'Syllabus' : 'What to learn'} sub={exam ? 'Add each unit or topic, tick it when you can explain it' : 'Topics, courses and projects, in order'}
            placeholder={exam ? 'Unit 1: Cardiovascular disorders' : 'Pandas basics'} empty="Nothing added yet." />
          <Notes doc={doc} set={set} title="Notes" placeholder="Key points, doubts to clear, resources" />
          <Sec title="Study sessions"><LogList area={b.id} track={l.id} days={lastDays(60)} empty="Log a session or start a focus timer." /></Sec>
        </div>
        <div className="stack">
          {l.drugs && <DrugDeck />}
          <Sec title="Consistency"><Heat value={leafDays(l)} label={d => `${nice(d)} · ${mins(minutes(b.id, d, l.id))}`} /></Sec>
        </div>
      </div>
    </>
  )
}

/* ---------- Academic project ---------- */
function Project({ b, l }: P) {
  const [doc, set] = useDoc(K.leaf(l.id), D.leaf)
  const lastUpdate = [...doc.updates].sort((a, z) => z.date.localeCompare(a.date))[0]
  return (
    <>
      <TimeTiles b={b} l={l} extra={[{ label: 'Updates', value: doc.updates.length, sub: lastUpdate ? `last ${nice(lastUpdate.date)}` : undefined }]} />
      <div className="cols">
        <div className="stack">
          <Updates doc={doc} set={set} />
        </div>
        <div className="stack">
          <Notes doc={doc} set={set} title="About the project" placeholder="Goal, dataset, methods (ARIMA, Prophet, LSTM…), how you measure accuracy, guide's feedback" />
          <Checklist items={doc.steps} onChange={v => set(x => { x.steps = v })} title="Milestones" placeholder="Literature review done" empty="Add the big steps: data, model, results, thesis, viva." />
        </div>
      </div>
      <Tasks doc={doc} set={set} />
      <Sec title="Time spent"><LogList area={b.id} track={l.id} days={lastDays(60)} empty="Log time or start a focus timer." /></Sec>
    </>
  )
}

/* ---------- Building ---------- */
function Business({ b, l }: P) {
  const [doc, set] = useDoc(K.leaf(l.id), D.leaf)
  const month = lastDays(30)
  const net = doc.money.filter(m => month.includes(m.date)).reduce((a, m) => a + (m.kind === 'in' ? m.amt : -m.amt), 0)
  return (
    <>
      <TimeTiles b={b} l={l} extra={[{ label: 'Net, 30 days', value: inr(net) }]} />
      <Tasks doc={doc} set={set} />
      <div className="cols even">
        <MoneyLog doc={doc} set={set} />
        <div className="stack">
          <Notes doc={doc} set={set} title="Notes" placeholder="Clients, suppliers, ideas, what's working" />
          <Sec title="Work log"><LogList area={b.id} track={l.id} days={lastDays(60)} empty="No work logged in the last 60 days." /></Sec>
        </div>
      </div>
    </>
  )
}
function Channel({ b, l }: P) {
  const [doc, set] = useDoc(K.leaf(l.id), D.leaf)
  const last = VIDEO_STAGES.length - 1
  return (
    <>
      <TimeTiles b={b} l={l} extra={[{ label: 'Published', value: doc.videos.filter(v => v.stage >= last).length, sub: `${doc.videos.filter(v => v.stage < last).length} in progress` }]} />
      <div className="cols">
        <Pipeline items={doc.videos} onChange={v => set(x => { x.videos = v })} stages={VIDEO_STAGES} title="Videos"
          sub="Teach what you study. Each video is revision and an asset." what="Heart failure drugs in 10 minutes" tagLabel="Subject" tagDefault="Pharmacotherapeutics"
          empty="Add your first video idea." />
        <div className="stack">
          <Notes doc={doc} set={set} title="Channel notes" placeholder="Video ideas, thumbnail ideas, what viewers ask for" />
          <Sec title="Work log"><LogList area={b.id} track={l.id} days={lastDays(60)} empty="No work logged yet." /></Sec>
        </div>
      </div>
      <Tasks doc={doc} set={set} />
    </>
  )
}
function Tutoring({ b, l }: P) {
  const [doc, set] = useDoc(K.leaf(l.id), D.leaf)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const month = lastDays(30)
  const sessions = (who: string) => sumDays(month, d => logsOn(d).filter(x => x.track === l.id && x.who === who).length)
  const active = doc.students.filter(s => s.active)
  return (
    <>
      <TimeTiles b={b} l={l} extra={[{ label: 'Active students', value: active.length }]} />
      <div className="cols even">
        <Sec title="Students">
          {doc.students.length ? (
            <ul className="list">
              {doc.students.map(s => (
                <li key={s.id} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ padding: '8px 0', opacity: s.active ? 1 : 0.55 }}>
                    <div style={{ fontWeight: 600 }}>{s.name} {!s.active && <span className="flag">paused</span>}</div>
                    <div className="small dim">{s.note}{s.note ? ' · ' : ''}{sessions(s.id)} sessions in 30 days</div>
                  </div>
                  <span className="row" style={{ flex: 'none', gap: 4 }}>
                    {s.active && <button className="btn small primary" onClick={() => openLog({ area: b.id, track: l.id, who: s.id, note: `Session with ${s.name}` })}>Session done</button>}
                    <button className="btn small" onClick={() => set(x => { const it = x.students.find(i => i.id === s.id); if (it) it.active = !it.active })}>{s.active ? 'Pause' : 'Resume'}</button>
                    <button className="x" aria-label={`Remove ${s.name}`} onClick={() => set(x => { x.students = x.students.filter(i => i.id !== s.id) })}>×</button>
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="empty">Add your two students to track sessions and fees.</p>}
          <form className="form" onSubmit={e => {
            e.preventDefault()
            if (!name.trim()) return
            set(x => { x.students.push({ id: uid(), name: name.trim(), note: note.trim(), active: true }) })
            setName('')
            setNote('')
          }}>
            <label className="field"><span className="label">Student</span><input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={60} /></label>
            <label className="field"><span className="label">Subject, class, fee</span><input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Pharmacology, ₹500/class" maxLength={100} /></label>
            <button className="btn">Add</button>
          </form>
        </Sec>
        <MoneyLog doc={doc} set={set} title="Fees" placeholder="Student and month" />
      </div>
      <div className="cols even">
        <Sec title="Sessions"><LogList area={b.id} track={l.id} days={lastDays(60)} empty="Tap Session done after each class." /></Sec>
        <Notes doc={doc} set={set} title="Lesson notes" placeholder="What each student covered, where they struggle, homework" />
      </div>
    </>
  )
}

/* ---------- Research ---------- */
function Research({ b, l }: P) {
  const [doc, set] = useDoc(K.leaf(l.id), D.leaf)
  const stages = l.stages ?? ['Idea', 'Working', 'Writing', 'Submitted', 'Done']
  return (
    <>
      <TimeTiles b={b} l={l} extra={[{ label: stages[stages.length - 1], value: doc.items.filter(i => i.stage >= stages.length - 1).length, sub: `${doc.items.length} in total` }]} />
      <div className="cols">
        <Pipeline items={doc.items} onChange={v => set(x => { x.items = v })} stages={stages} title="Pieces of work"
          what={l.id === 'oral' ? 'Antibiotic stewardship audit' : l.id === 'meta' ? 'Efficacy of SGLT2 inhibitors in HFpEF' : 'Working title'}
          tagLabel={l.id === 'oral' ? 'Conference' : 'Target journal'} empty="Add the first idea you want to take forward." />
        <div className="stack">
          <Notes doc={doc} set={set} title="Notes" placeholder="Ideas, guides to approach, journals and conferences, deadlines" />
          <Sec title="Time spent"><LogList area={b.id} track={l.id} days={lastDays(60)} empty="Log time or start a focus timer." /></Sec>
        </div>
      </div>
    </>
  )
}

/* ---------- Career ---------- */
const CAREER_PROMPT: Record<string, string> = {
  map: 'Which roles fit me best? What does each need? What do I already have? What will I do this month to move closer?',
}
function Career({ b, l }: P) {
  const [doc, set] = useDoc(K.leaf(l.id), D.leaf)
  const steps = doc.steps.filter(s => s.done).length
  return (
    <>
      <TimeTiles b={b} l={l} extra={[{ label: 'Steps done', value: doc.steps.length ? `${steps}/${doc.steps.length}` : '–' }]} />
      <div className="cols">
        <div className="stack">
          <Notes doc={doc} set={set} big title={l.id === 'map' ? 'Your career map' : 'What I know about this path'}
            sub={l.id === 'map' ? "It's fine if this is messy. Write what you know and update it as it gets clearer." : 'What the job is, skills and certificates it needs, who hires for it'}
            placeholder={CAREER_PROMPT[l.id] ?? 'Day-to-day work, tools (SAS, Medidata, R), entry roles, salaries, people doing it'} />
          <Checklist items={doc.steps} onChange={v => set(x => { x.steps = v })} title="Next steps" placeholder="Talk to someone working in this role" empty="Add small, concrete steps." />
        </div>
        <div className="stack">
          <Sec title="Resources" sub="Courses, certifications, people, job posts">
            <ListEditor items={doc.links} onChange={v => set(x => { x.links = v })} placeholder="Course name or link" label="Add a resource" />
          </Sec>
          <Sec title="Time spent learning about it"><LogList area={b.id} track={l.id} days={lastDays(60)} empty="Log time spent on courses, reading or networking." /></Sec>
        </div>
      </div>
    </>
  )
}

/* ---------- Akhira ---------- */
function Prayer({ l }: P) {
  const [date, setDate] = useState(today())
  const [a, setA] = useDoc(K.akhira(date), D.akhira)
  const t = today()
  const week = weekDays(t).filter(d => d <= t)
  const fridays = lastDays(30).filter(isFriday)
  return (
    <>
      <Tiles four items={[
        { label: 'On time this week', value: `${sumDays(week, d => prayed(d).onTime)}/${week.length * 5}` },
        { label: 'All five on time', value: `${streakOf(d => (prayed(d).onTime === 5 ? 1 : 0))}d`, sub: 'streak' },
        { label: "Jumu'ah, 30 days", value: `${fridays.filter(d => akhiraDay(d).jumuah).length}/${fridays.length}` },
        { label: 'Prayed today', value: `${prayed(t).prayed}/5` },
      ]} />
      <div className="cols">
        <div className="stack">
          <DateNav date={date} setDate={setDate} />
          <Sec title="Salah">
            <ul className="list">
              {PRAYERS.map(([k, name]) => (
                <li key={k} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ padding: '10px 0', fontWeight: 600 }}>{name}</span>
                  <Seg<PrayerState> label={name} value={a.p?.[k]} options={[{ v: 'on', t: 'On time' }, { v: 'late', t: 'Late' }, { v: 'missed', t: 'Missed' }]}
                    onChange={v => setA(x => { x.p = x.p || {}; if (v) x.p[k] = v; else delete x.p[k] })} />
                </li>
              ))}
            </ul>
            {isFriday(date) && <Check checked={!!a.jumuah} onChange={c => setA(x => { x.jumuah = c })}>Attended Jumu'ah</Check>}
          </Sec>
          <Sec title="Also track"><Habits scope={l.id} date={date} placeholder="Sunnah prayers, tahajjud…" /></Sec>
        </div>
        <div className="stack">
          <Sec title="On time" sub="Last 14 days, out of 5"><DayCols value={d => prayed(d).onTime} fmt={v => `${v} of 5`} max={5} /></Sec>
          <Sec title="Consistency"><Heat value={leafDays(l)} label={d => `${nice(d)} · ${prayed(d).onTime} on time`} /></Sec>
        </div>
      </div>
    </>
  )
}
function Quran({ l }: P) {
  const [date, setDate] = useState(today())
  const [a, setA] = useDoc(K.akhira(date), D.akhira)
  const [doc, set] = useDoc(K.leaf(l.id), D.leaf)
  const t = today()
  const pages = (d: string) => akhiraDay(d).quran ?? 0
  return (
    <>
      <Tiles four items={[
        { label: 'This week', value: sumDays(weekDays(t).filter(d => d <= t), pages), sub: 'pages' },
        { label: 'Last 30 days', value: sumDays(lastDays(30), pages), sub: 'pages' },
        { label: 'Streak', value: `${streakOf(pages)}d` },
        { label: 'Daily goal', value: doc.goal ? `${doc.goal} pages` : '–' },
      ]} />
      <div className="cols">
        <div className="stack">
          <DateNav date={date} setDate={setDate} />
          <Sec title="Reading">
            <div className="row between"><span>Pages read</span><Stepper label="Quran pages" value={a.quran} max={604} onChange={v => setA(x => { x.quran = v })} /></div>
            <div className="row between"><span>My daily goal</span><Stepper label="daily goal" value={doc.goal} max={60} onChange={v => set(x => { x.goal = v })} /></div>
            <label className="field"><span className="label">Where I am, what touched me</span>
              <textarea value={a.notes?.quran ?? ''} style={{ minHeight: 90 }} placeholder="Surah Al-Kahf, ayah 10. Reflection…"
                onChange={e => { const v = e.target.value; setA(x => { x.notes = { ...x.notes, quran: v } }) }} />
            </label>
          </Sec>
        </div>
        <div className="stack">
          <Sec title="Pages" sub="Last 14 days"><DayCols value={pages} fmt={v => `${v} pages`} /></Sec>
          <Sec title="Consistency"><Heat value={d => pages(d)} label={d => `${nice(d)} · ${pages(d)} pages`} /></Sec>
        </div>
      </div>
    </>
  )
}
function Daily({ l }: P) {
  const [date, setDate] = useState(today())
  const [a, setA] = useDoc(K.akhira(date), D.akhira)
  const t = today()
  const week = weekDays(t).filter(d => d <= t)
  const done = (d: string) => leafScore(l, d)
  const checked = !!(a.checks?.[l.id] || (l.id === 'dhikr' && a.dhikr))
  return (
    <>
      <Tiles four items={[
        { label: 'Streak', value: `${streakOf(done)}d` },
        { label: 'This week', value: `${week.filter(d => done(d) > 0).length}/${week.length}`, sub: 'days' },
        { label: 'Last 30 days', value: lastDays(30).filter(d => done(d) > 0).length, sub: 'days' },
        l.count
          ? { label: `${l.count}, this week`, value: sumDays(week, d => akhiraDay(d).counts?.[l.id] ?? 0) }
          : { label: 'Today', value: done(t) ? 'Done' : 'Not yet' },
      ]} />
      <div className="cols">
        <div className="stack">
          <DateNav date={date} setDate={setDate} />
          <Sec title={date === t ? 'Today' : longDate(date)}>
            <Check checked={checked} onChange={c => setA(x => { x.checks = { ...x.checks, [l.id]: c }; if (l.id === 'dhikr') x.dhikr = c })}>{l.prompt ?? `Did ${l.name.toLowerCase()} today`}</Check>
            {l.id === 'nafs' && <Check checked={!!a.noNeg} onChange={c => setA(x => { x.noNeg = c })}>Stayed away from negativity</Check>}
            {l.count && (
              <div className="row between"><span>{l.count}</span>
                <Stepper label={l.count} step={l.id === 'istighfar' ? 33 : 1} max={10000} value={a.counts?.[l.id]} onChange={v => setA(x => { x.counts = { ...x.counts, [l.id]: v ?? 0 } })} />
              </div>
            )}
            <label className="field"><span className="label">{l.id === 'nafs' ? 'What tested me, and how I handled it' : 'Reflection'}</span>
              <textarea value={a.notes?.[l.id] ?? ''} style={{ minHeight: 90 }} onChange={e => { const v = e.target.value; setA(x => { x.notes = { ...x.notes, [l.id]: v } }) }} />
            </label>
          </Sec>
          <Sec title="Also track"><Habits scope={l.id} date={date} placeholder={l.id === 'nafs' ? 'Guarded my tongue' : 'Add something to tick daily'} /></Sec>
        </div>
        <Sec title="Consistency"><Heat value={d => done(d) * 2} label={d => `${nice(d)} · ${done(d) ? 'done' : 'not done'}`} /></Sec>
      </div>
    </>
  )
}

/* ---------- Self improvement ---------- */
function Skill({ b, l }: P) {
  const t = today()
  const wk = weekStart(t)
  const [rate, setRate] = useDoc(K.ratings(wk), D.ratings)
  const [doc, set] = useDoc(K.leaf(l.id), D.leaf)
  const weeks = Array.from({ length: 8 }, (_, i) => shift(wk, -7 * (7 - i)))
  const moments = (d: string) => logsOn(d).filter(x => x.track === l.id).length
  return (
    <>
      <Tiles four items={[
        { label: 'My rating this week', value: rate.r[l.id] ? `${rate.r[l.id]}/5` : '–' },
        { label: 'Moments this week', value: sumDays(weekDays(t).filter(d => d <= t), moments) },
        { label: 'Last 30 days', value: sumDays(lastDays(30), moments), sub: 'moments' },
        { label: 'Practice streak', value: `${streakOf(moments)}d` },
      ]} />
      <div className="cols">
        <div className="stack">
          <Sec title="How I showed up this week" sub="Rate yourself by your own standard. 1 is rough, 5 is your best self.">
            <Seg label={`Rate ${l.name}`} value={rate.r[l.id]} options={[1, 2, 3, 4, 5].map(v => ({ v, t: String(v) }))} onChange={v => setRate(x => { if (v == null) delete x.r[l.id]; else x.r[l.id] = v })} />
            <div className="row small dim" style={{ gap: 10 }}>
              Last 8 weeks
              <span className="dots">
                {weeks.map(w => {
                  const v = get(K.ratings(w), D.ratings).r[l.id]
                  return <i key={w} className={v >= 4 ? 'on' : v ? 'half' : ''} title={`${nice(w, { day: 'numeric', month: 'short' })}: ${v ?? 'not rated'}`} />
                })}
              </span>
            </div>
          </Sec>
          <Sec title="Moments" sub="Times you did this well, or practised it">
            <LogList area={b.id} track={l.id} days={lastDays(60)} empty="Log a moment when you handle it the way you want to." />
          </Sec>
        </div>
        <div className="stack">
          <Notes doc={doc} set={set} title="What good looks like" placeholder="Speak slowly, make one point at a time, pause instead of filler words" />
          <Checklist items={doc.steps} onChange={v => set(x => { x.steps = v })} title="Practice ideas" placeholder="Explain one topic out loud in 2 minutes" empty="Add small ways to practise." />
        </div>
      </div>
    </>
  )
}

/* ---------- Things I love ---------- */
function Activity({ b, l }: P) {
  const [doc, set] = useDoc(K.leaf(l.id), D.leaf)
  const times = (d: string) => logsOn(d).filter(x => x.track === l.id).length
  const since = daysSince(times)
  return (
    <>
      <Tiles four items={[
        { label: 'Last time', value: since == null ? '–' : since === 0 ? 'Today' : `${since}d ago` },
        { label: 'Last 30 days', value: sumDays(lastDays(30), times), sub: 'times' },
        { label: 'This year', value: sumDays(lastDays(365), times), sub: 'times' },
        { label: 'On the wish list', value: doc.wish.length },
      ]} />
      <div className="cols even">
        <Sec title={l.id === 'solo' ? 'Adventures to plan' : 'Wish list'} sub="Places, food, ideas. Tick them off by logging them.">
          <ListEditor items={doc.wish} onChange={v => set(x => { x.wish = v })} placeholder={WISH[l.id] ?? 'Something to do soon'} label="Add to the wish list" />
        </Sec>
        <Sec title="Done" right={<button className="btn small primary" onClick={() => openLog({ area: b.id, track: l.id })}>Log it</button>}>
          <LogList area={b.id} track={l.id} days={lastDays(180)} empty="Nothing logged yet. Plan something small this week." />
        </Sec>
      </div>
    </>
  )
}
const WISH: Record<string, string> = {
  food: 'Kuttichira for pathiri', travel: 'Wayanad over a long weekend', cook: 'Try a new biryani recipe',
  feelgood: 'A comfort movie or series', solo: 'Solo day trip by train', exercise: 'Evening walk by the beach',
}
function PeopleLeaf({ b, l }: P) {
  return (
    <div className="cols">
      <People />
      <Sec title="Good conversations" right={<button className="btn small primary" onClick={() => openLog({ area: b.id, track: l.id })}>Log one</button>}>
        <LogList area={b.id} track={l.id} days={lastDays(90)} empty="Log conversations that left you feeling good." />
      </Sec>
    </div>
  )
}

const BODY: Partial<Record<Leaf['kind'], (p: P) => React.ReactElement>> = {
  learn: Learn, project: Project, service: Business, product: Business, channel: Channel, tutoring: Tutoring,
  pipeline: Research, career: Career, prayer: Prayer, quran: Quran, daily: Daily, skill: Skill, activity: Activity, people: PeopleLeaf,
}

/* ---------- remove a leaf you added ---------- */
function RemoveLeaf({ l }: P) {
  const [cfg, setCfg] = useDoc(K.config, DEFAULT_CONFIG)
  const [sure, setSure] = useState(false)
  if (!(cfg.extraLeaves || []).some(x => x.leaf.id === l.id)) return null
  return (
    <button className="link" style={{ justifySelf: 'start', color: 'var(--mute)' }} onClick={() => {
      if (!sure) return setSure(true)
      setCfg(c => { c.extraLeaves = config().extraLeaves.filter(x => x.leaf.id !== l.id) })
      location.hash = '#home'
    }}>{sure ? `Remove ${l.name} from the map? Its entries stay in your backup.` : 'Remove from the map'}</button>
  )
}
