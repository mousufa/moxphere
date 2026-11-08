import { useState } from 'react'
import { D, DEFAULT_CONFIG, K, STUDY_GROUPS, type Drug } from '../lib/model'
import { daysBetween, lastDays, mins, nice, shift, today, uid, weekDays } from '../lib/date'
import { useDoc, useStore } from '../lib/store'
import { config, daysSince, minutes, score, streak, sumDays, tracksOf } from '../lib/stats'
import { Check, Heat, PH, Sec, Stepper, Tiles } from '../ui/bits'
import { LogList, openLog } from '../ui/logs'

const STEPS = [1, 3, 7, 14, 30, 60, 120]

export default function Study() {
  useStore()
  const t = today()
  const week = weekDays(t).filter(d => d <= t)
  const tracks = tracksOf('study')
  const [drugs] = useDoc(K.drugs, D.drugs)
  const due = drugs.items.filter(x => x.next <= t)
  const [open, setOpen] = useState<string | null>(null)
  const max = Math.max(30, ...tracks.map(tr => sumDays(week, d => minutes('study', d, tr.id))))
  return (
    <div className="stack">
      <PH title="Study" sub="Pharma core, non-clinical career learning and tech" right={
        <div className="row">
          <button className="btn primary" onClick={() => openLog({ area: 'study' })}>Log study</button>
          <a className="btn" href="#focus">Focus</a>
        </div>
      } />
      <Tiles four items={[
        { label: 'Today', value: mins(minutes('study', t)) },
        { label: 'This week', value: mins(sumDays(week, d => minutes('study', d))) },
        { label: 'Streak', value: `${streak('study')}d` },
        { label: 'Drugs to revise', value: due.length, sub: `${drugs.items.length} in your deck` },
      ]} />
      <div className="cols">
        <div className="stack">
          {STUDY_GROUPS.map(g => (
            <Sec key={g} title={g} sub={g === 'Career' ? 'Non-clinical pharma: CDM, clinical research, HEOR, regulatory, data and AI' : g === 'Tech' ? 'Python, AI and ML' : 'Your core: drugs and your university exam'}>
              <div className="bars">
                {tracks.filter(tr => tr.group === g).map(tr => {
                  const wm = sumDays(week, d => minutes('study', d, tr.id))
                  const since = daysSince('study', tr.id)
                  return (
                    <div key={tr.id}>
                      <button className="bar" style={{ width: '100%', background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' }}
                        aria-expanded={open === tr.id} onClick={() => setOpen(open === tr.id ? null : tr.id)}>
                        <span className="name">{tr.name}</span>
                        <span className="track"><span className="fill" style={{ width: `${(wm / max) * 100}%` }} /></span>
                        <span className="val">{wm ? mins(wm) : since == null ? 'not yet' : `${since}d ago`}</span>
                      </button>
                      {open === tr.id && <TrackPanel id={tr.id} />}
                    </div>
                  )
                })}
              </div>
            </Sec>
          ))}
          <AddTrack />
          <Sec title="Recent study"><LogList area="study" days={lastDays(14)} empty="Nothing logged in the last two weeks." /></Sec>
        </div>
        <div className="stack">
          <Reminder />
          <Exam />
          <DrugDeck />
          <Sec title="Consistency"><Heat value={d => score('study', d)} label={(d) => `${nice(d)} · ${mins(minutes('study', d))}`} /></Sec>
        </div>
      </div>
    </div>
  )
}

function TrackPanel({ id }: { id: string }) {
  const [ms, setMs] = useDoc(K.milestones, D.milestones)
  const [v, setV] = useState('')
  const items = ms.items.filter(m => m.track === id)
  const total = sumDays(lastDays(365), d => minutes('study', d, id))
  return (
    <div className="box" style={{ marginTop: 8, display: 'grid', gap: 8 }}>
      <div className="row between">
        <span className="small dim">{mins(total)} in the last year</span>
        <button className="btn small primary" onClick={() => openLog({ area: 'study', track: id })}>Log</button>
      </div>
      <span className="label">Milestones</span>
      {items.length ? (
        <ul className="list">
          {items.map(m => (
            <li key={m.id}>
              <Check checked={m.done} onChange={c => setMs(x => { const it = x.items.find(i => i.id === m.id); if (it) it.done = c })}>{m.t}</Check>
              <button className="x" aria-label={`Remove ${m.t}`} onClick={() => setMs(x => { x.items = x.items.filter(i => i.id !== m.id) })}>×</button>
            </li>
          ))}
        </ul>
      ) : <p className="empty small">Add the steps that prove you know this, like a course, a project or a certificate.</p>}
      <form className="row" onSubmit={e => {
        e.preventDefault()
        if (!v.trim()) return
        setMs(x => { x.items.push({ id: uid(), track: id, t: v.trim(), done: false }) })
        setV('')
      }}>
        <input type="text" style={{ flex: 1 }} value={v} onChange={e => setV(e.target.value)} placeholder="Add a milestone" aria-label="Add a milestone" maxLength={200} />
        <button className="btn">Add</button>
      </form>
    </div>
  )
}

function AddTrack() {
  const [, setCfg] = useDoc(K.config, DEFAULT_CONFIG)
  const [name, setName] = useState('')
  const [group, setGroup] = useState(STUDY_GROUPS[1])
  return (
    <form className="form" onSubmit={e => {
      e.preventDefault()
      if (!name.trim()) return
      setCfg(c => { c.tracks = [...config().tracks, { id: uid(), area: 'study', name: name.trim(), group }] })
      setName('')
    }}>
      <label className="field"><span className="label">New topic</span><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="SQL, SAS, pharmacovigilance…" maxLength={60} /></label>
      <label className="field" style={{ flex: '0 1 150px' }}><span className="label">Under</span>
        <select value={group} onChange={e => setGroup(e.target.value)}>{STUDY_GROUPS.map(g => <option key={g}>{g}</option>)}</select>
      </label>
      <button className="btn">Add topic</button>
    </form>
  )
}

function Reminder() {
  const [cfg, setCfg] = useDoc(K.config, DEFAULT_CONFIG)
  const r = { ...DEFAULT_CONFIG.reminder, ...cfg.reminder }
  return (
    <div className="box row">
      <strong className="grow" style={{ font: '500 20px/1.2 var(--display)' }}>Study reminder</strong>
      <label className="row small dim" style={{ gap: 6 }}>
        <input type="checkbox" checked={r.on} onChange={e => setCfg(c => { c.reminder = { ...r, on: e.target.checked } })} style={{ accentColor: 'var(--accent)' }} /> Remind me at
      </label>
      <input type="time" value={r.time} style={{ width: 'auto' }} aria-label="Reminder time" onChange={e => setCfg(c => { c.reminder = { ...r, time: e.target.value || '19:00' } })} />
      <p className="small mute" style={{ width: '100%' }}>Shows on Today if you haven't logged study by then.</p>
    </div>
  )
}

function Exam() {
  const [cfg, setCfg] = useDoc(K.config, DEFAULT_CONFIG)
  const [ex, setEx] = useDoc(K.exam, D.exam)
  const [v, setV] = useState('')
  const exam = { ...DEFAULT_CONFIG.exam, ...cfg.exam }
  const left = exam.date ? daysBetween(today(), exam.date) : null
  const done = ex.subjects.reduce((a, s) => a + s.done, 0), total = ex.subjects.reduce((a, s) => a + s.total, 0)
  return (
    <Sec title="University exam" right={left != null && <span className="mono">{left > 0 ? `${left} days left` : left === 0 ? 'Today' : 'Done'}</span>}>
      <div className="form">
        <label className="field"><span className="label">Exam</span><input type="text" value={exam.name} maxLength={80} onChange={e => setCfg(c => { c.exam = { ...exam, name: e.target.value } })} /></label>
        <label className="field" style={{ flex: '0 1 170px' }}><span className="label">First paper</span><input type="date" value={exam.date} onChange={e => setCfg(c => { c.exam = { ...exam, date: e.target.value } })} /></label>
      </div>
      {total > 0 && (
        <div>
          <div className="row between small"><span>Syllabus covered</span><span className="mono">{Math.round((done / total) * 100)}%</span></div>
          <div className="meter"><i style={{ width: `${(done / total) * 100}%` }} /></div>
        </div>
      )}
      {ex.subjects.length > 0 && (
        <ul className="list">
          {ex.subjects.map(s => (
            <li key={s.id} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ padding: '8px 0', minWidth: 120 }}>{s.name}</span>
              <span className="row" style={{ flex: 'none', gap: 6 }}>
                <Stepper label={`units done in ${s.name}`} value={s.done} max={s.total} onChange={n => setEx(x => { const it = x.subjects.find(i => i.id === s.id); if (it) it.done = n ?? 0 })} />
                <span className="mono small dim">of {s.total}</span>
                <button className="x" aria-label={`Remove ${s.name}`} onClick={() => setEx(x => { x.subjects = x.subjects.filter(i => i.id !== s.id) })}>×</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <form className="row" onSubmit={e => {
        e.preventDefault()
        const m = v.trim().match(/^(.*?)(?:\s+(\d+))?$/)
        if (!m || !m[1]) return
        setEx(x => { x.subjects.push({ id: uid(), name: m[1], done: 0, total: Number(m[2] || 5) }) })
        setV('')
      }}>
        <input type="text" style={{ flex: 1 }} value={v} onChange={e => setV(e.target.value)} placeholder="Subject and number of units, e.g. Pharmacotherapeutics 5" aria-label="Add a subject" maxLength={80} />
        <button className="btn">Add</button>
      </form>
    </Sec>
  )
}

function DrugDeck() {
  const [deck, setDeck] = useDoc(K.drugs, D.drugs)
  const [name, setName] = useState('')
  const [cls, setCls] = useState('')
  const [q, setQ] = useState('')
  const [showAll, setShowAll] = useState(false)
  const t = today()
  const due = deck.items.filter(x => x.next <= t).sort((a, b) => a.next.localeCompare(b.next))
  const mastered = deck.items.filter(x => x.level >= 5).length
  const review = (id: string, ok: boolean) => setDeck(x => {
    const it = x.items.find(i => i.id === id)
    if (!it) return
    it.level = ok ? Math.min(STEPS.length - 1, it.level + 1) : 0
    it.next = shift(t, ok ? STEPS[it.level] : 1)
  })
  const shown = deck.items.filter(x => !q || `${x.name} ${x.cls}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <Sec title="Drug deck" sub="Revise each drug just before you'd forget it" right={<span className="mono small dim">{mastered} mastered</span>}>
      {due.length ? (
        <ul className="list">
          {due.slice(0, 12).map(x => <DrugRow key={x.id} x={x} onReview={review} />)}
        </ul>
      ) : <p className="empty">{deck.items.length ? 'Nothing due today.' : 'Add the drugs you are learning. Each one comes back for revision after 1, 3, 7, 14, 30 days and so on.'}</p>}
      <form className="form" onSubmit={e => {
        e.preventDefault()
        if (!name.trim()) return
        setDeck(x => { x.items.push({ id: uid(), name: name.trim(), cls: cls.trim(), note: '', level: 0, next: shift(t, 1), added: t }) })
        setName('')
        setCls('')
      }}>
        <label className="field"><span className="label">Drug</span><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Metformin" maxLength={80} /></label>
        <label className="field"><span className="label">Class or note</span><input type="text" value={cls} onChange={e => setCls(e.target.value)} placeholder="Biguanide" maxLength={120} /></label>
        <button className="btn">Add drug</button>
      </form>
      {deck.items.length > 0 && <button className="link" style={{ justifySelf: 'start' }} onClick={() => setShowAll(!showAll)}>{showAll ? 'Hide all drugs' : `Show all ${deck.items.length} drugs`}</button>}
      {showAll && (
        <>
          <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search drugs" aria-label="Search drugs" />
          <ul className="list">
            {shown.map(x => (
              <li key={x.id}>
                <span style={{ padding: '8px 0' }}>{x.name} <span className="dim small">{x.cls}</span></span>
                <span className="mono small dim" style={{ padding: '10px 0', flex: 'none' }}>next {nice(x.next, { day: 'numeric', month: 'short' })}</span>
                <button className="x" aria-label={`Remove ${x.name}`} onClick={() => setDeck(d => { d.items = d.items.filter(i => i.id !== x.id) })}>×</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sec>
  )
}

function DrugRow({ x, onReview }: { x: Drug; onReview: (id: string, ok: boolean) => void }) {
  return (
    <li style={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ padding: '8px 0' }}>
        <b style={{ fontWeight: 600 }}>{x.name}</b> <span className="dim small">{x.cls}</span>
      </span>
      <span className="row" style={{ flex: 'none', gap: 6 }}>
        <button className="btn small" onClick={() => onReview(x.id, false)}>Forgot</button>
        <button className="btn small primary" onClick={() => onReview(x.id, true)}>Knew it</button>
      </span>
    </li>
  )
}
