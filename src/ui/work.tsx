import { useState } from 'react'
import { D, K, type Check as CheckT, type Drug, type Item, type LeafDoc, type TaskStatus } from '../lib/model'
import { daysBetween, longDate, nice, shift, today, uid } from '../lib/date'
import { useDoc } from '../lib/store'
import { Check, Sec } from './bits'

export type SetLeaf = (f: (d: LeafDoc) => void) => void
export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

/* ---------- notes ---------- */
export function Notes({ doc, set, title, sub, placeholder, big }: { doc: LeafDoc; set: SetLeaf; title: string; sub?: string; placeholder?: string; big?: boolean }) {
  return (
    <Sec title={title} sub={sub}>
      <textarea value={doc.note} placeholder={placeholder} aria-label={title} style={big ? { minHeight: 260 } : undefined}
        onChange={e => { const v = e.target.value; set(x => { x.note = v }) }} />
    </Sec>
  )
}

/* ---------- checklist (topics, steps) ---------- */
export function Checklist({ items, onChange, title, sub, placeholder, empty }: {
  items: CheckT[]; onChange: (v: CheckT[]) => void; title: string; sub?: string; placeholder: string; empty: string
}) {
  const [v, setV] = useState('')
  const done = items.filter(i => i.done).length
  return (
    <Sec title={title} sub={sub} right={items.length > 0 && <span className="small dim">{done} of {items.length} done</span>}>
      {items.length > 0 && <div className="meter" aria-hidden="true"><i style={{ width: `${(done / items.length) * 100}%` }} /></div>}
      {items.length ? (
        <ul className="list">
          {items.map(it => (
            <li key={it.id}>
              <Check checked={it.done} onChange={c => onChange(items.map(x => (x.id === it.id ? { ...x, done: c } : x)))}>{it.t}</Check>
              <button className="x" aria-label={`Remove ${it.t}`} onClick={() => onChange(items.filter(x => x.id !== it.id))}>×</button>
            </li>
          ))}
        </ul>
      ) : <p className="empty">{empty}</p>}
      <form className="row" onSubmit={e => {
        e.preventDefault()
        if (!v.trim()) return
        onChange([...items, { id: uid(), t: v.trim(), done: false }])
        setV('')
      }}>
        <input type="text" style={{ flex: 1 }} value={v} onChange={e => setV(e.target.value)} placeholder={placeholder} aria-label={placeholder} maxLength={200} />
        <button className="btn">Add</button>
      </form>
    </Sec>
  )
}

/* ---------- dated updates (project log) ---------- */
export function Updates({ doc, set }: { doc: LeafDoc; set: SetLeaf }) {
  const [text, setText] = useState('')
  const [date, setDate] = useState(today())
  const list = [...doc.updates].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <Sec title="Project updates" sub="What you did, what you found, what's blocking you">
      <form className="sec" style={{ gap: 8 }} onSubmit={e => {
        e.preventDefault()
        if (!text.trim()) return
        set(x => { x.updates.push({ id: uid(), date, text: text.trim() }) })
        setText('')
      }}>
        <textarea value={text} onChange={e => setText(e.target.value)} aria-label="New update" style={{ minHeight: 120 }}
          placeholder="Cleaned the sales data, tried ARIMA vs Prophet, MAPE 14%. Next: add holiday effects." />
        <div className="row">
          <input type="date" value={date} max={today()} onChange={e => e.target.value && setDate(e.target.value)} style={{ width: 'auto' }} aria-label="Date of update" />
          <button className="btn primary">Save update</button>
        </div>
      </form>
      {list.length ? (
        <ul className="list">
          {list.map(u => (
            <li key={u.id}>
              <div style={{ padding: '10px 0' }}>
                <div className="small dim" style={{ fontWeight: 700 }}>{longDate(u.date)}</div>
                <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{u.text}</p>
              </div>
              <button className="x" aria-label="Remove update" onClick={() => set(x => { x.updates = x.updates.filter(i => i.id !== u.id) })}>×</button>
            </li>
          ))}
        </ul>
      ) : <p className="empty">Your first update will appear here.</p>}
    </Sec>
  )
}

/* ---------- tasks ---------- */
const COLS: [TaskStatus, string][] = [['todo', 'To do'], ['doing', 'Doing'], ['done', 'Done']]
export function Tasks({ doc, set }: { doc: LeafDoc; set: SetLeaf }) {
  const [v, setV] = useState('')
  const move = (id: string, s: TaskStatus) => set(x => { const it = x.tasks.find(i => i.id === id); if (it) it.status = s })
  return (
    <Sec title="Tasks">
      <form className="row" onSubmit={e => {
        e.preventDefault()
        if (!v.trim()) return
        set(x => { x.tasks.push({ id: uid(), t: v.trim(), status: 'todo' }) })
        setV('')
      }}>
        <input type="text" style={{ flex: 1 }} value={v} onChange={e => setV(e.target.value)} placeholder="Add a task" aria-label="Add a task" maxLength={200} />
        <button className="btn">Add</button>
      </form>
      <div className="kanban">
        {COLS.map(([s, label]) => {
          const items = doc.tasks.filter(x => x.status === s)
          return (
            <div key={s} className="box" style={{ padding: 12 }}>
              <span className="label">{label} · {items.length}</span>
              <ul className="list">
                {(s === 'done' ? items.slice(-8) : items).map(x => (
                  <li key={x.id} style={{ alignItems: 'center' }}>
                    <span style={{ padding: '8px 0', overflowWrap: 'anywhere', color: s === 'done' ? 'var(--mute)' : undefined }}>{x.t}</span>
                    {s !== 'todo' && <button className="x" aria-label={`Move ${x.t} back`} onClick={() => move(x.id, s === 'done' ? 'doing' : 'todo')}>←</button>}
                    {s !== 'done' && <button className="x" aria-label={`Move ${x.t} forward`} onClick={() => move(x.id, s === 'todo' ? 'doing' : 'done')}>→</button>}
                    <button className="x" aria-label={`Remove ${x.t}`} onClick={() => set(d => { d.tasks = d.tasks.filter(i => i.id !== x.id) })}>×</button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </Sec>
  )
}

/* ---------- money ---------- */
export function MoneyLog({ doc, set, title = 'Money', placeholder = 'Client, order, supplies' }: { doc: LeafDoc; set: SetLeaf; title?: string; placeholder?: string }) {
  const [amt, setAmt] = useState('')
  const [note, setNote] = useState('')
  const [kind, setKind] = useState<'in' | 'out'>('in')
  const all = [...doc.money].sort((a, b) => b.date.localeCompare(a.date))
  const total = (k: 'in' | 'out') => doc.money.filter(m => m.kind === k).reduce((a, m) => a + m.amt, 0)
  return (
    <Sec title={title} right={<span className="small dim">All time {inr(total('in') - total('out'))}</span>}>
      <form className="form" onSubmit={e => {
        e.preventDefault()
        const n = Number(amt)
        if (!n) return
        set(x => { x.money.push({ id: uid(), date: today(), amt: Math.abs(n), kind, note: note.trim() }) })
        setAmt('')
        setNote('')
      }}>
        <label className="field" style={{ flex: '0 1 110px' }}><span className="label">Type</span>
          <select value={kind} onChange={e => setKind(e.target.value as 'in' | 'out')}><option value="in">Income</option><option value="out">Expense</option></select>
        </label>
        <label className="field" style={{ flex: '0 1 120px' }}><span className="label">Amount ₹</span><input type="number" inputMode="decimal" min={0} value={amt} onChange={e => setAmt(e.target.value)} /></label>
        <label className="field"><span className="label">For</span><input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder={placeholder} maxLength={120} /></label>
        <button className="btn">Add</button>
      </form>
      {all.length ? (
        <ul className="list">
          {all.slice(0, 30).map(m => (
            <li key={m.id}>
              <span style={{ padding: '8px 0' }}><span className="dim small">{nice(m.date)}</span> {m.note}</span>
              <span className="mono" style={{ padding: '8px 0', flex: 'none' }}>{m.kind === 'in' ? '+' : '−'}{inr(m.amt)}</span>
              <button className="x" aria-label="Remove entry" onClick={() => set(d => { d.money = d.money.filter(i => i.id !== m.id) })}>×</button>
            </li>
          ))}
        </ul>
      ) : <p className="empty">Log income and expenses to see if it's paying off.</p>}
    </Sec>
  )
}

/* ---------- staged pipeline (videos, papers, presentations) ---------- */
export function Pipeline({ items, onChange, stages, title, sub, what, tagLabel, tagDefault, empty }: {
  items: Item[]; onChange: (v: Item[]) => void; stages: string[]; title: string; sub?: string
  what: string; tagLabel: string; tagDefault?: string; empty: string
}) {
  const [title_, setTitle] = useState('')
  const [tag, setTag] = useState(tagDefault ?? '')
  const last = stages.length - 1
  const order = [...items].sort((a, b) => a.stage - b.stage)
  const setStage = (id: string, f: (s: number) => number) => onChange(items.map(x => (x.id === id ? { ...x, stage: Math.max(0, Math.min(last, f(x.stage))) } : x)))
  return (
    <Sec title={title} sub={sub} right={<span className="small dim">{items.filter(i => i.stage === last).length} {stages[last].toLowerCase()}</span>}>
      <form className="form" onSubmit={e => {
        e.preventDefault()
        if (!title_.trim()) return
        onChange([...items, { id: uid(), title: title_.trim(), subject: tag.trim(), stage: 0 }])
        setTitle('')
      }}>
        <label className="field"><span className="label">Title</span><input type="text" value={title_} onChange={e => setTitle(e.target.value)} placeholder={what} maxLength={160} /></label>
        <label className="field"><span className="label">{tagLabel}</span><input type="text" value={tag} onChange={e => setTag(e.target.value)} maxLength={80} /></label>
        <button className="btn">Add</button>
      </form>
      {order.length ? (
        <ul className="list">
          {order.map(v => (
            <li key={v.id} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ padding: '8px 0', minWidth: 160 }}>
                <div style={{ fontWeight: 600 }}>{v.title}</div>
                <div className="small dim">{v.subject ? `${v.subject} · ` : ''}{stages[Math.min(v.stage, last)]}</div>
                <div className="stage" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }} aria-hidden="true">
                  {stages.map((s, i) => <i key={s} className={i <= v.stage ? 'on' : ''} />)}
                </div>
              </div>
              <span className="row" style={{ flex: 'none', gap: 2 }}>
                <button className="x" disabled={v.stage === 0} aria-label="Back a stage" onClick={() => setStage(v.id, s => s - 1)}>←</button>
                {v.stage < last && <button className="btn small" onClick={() => setStage(v.id, s => s + 1)}>{stages[v.stage + 1]} →</button>}
                <button className="x" aria-label={`Remove ${v.title}`} onClick={() => onChange(items.filter(i => i.id !== v.id))}>×</button>
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="empty">{empty}</p>}
    </Sec>
  )
}

/* ---------- exam date ---------- */
export function ExamDate({ doc, set, label = 'Exam date' }: { doc: LeafDoc; set: SetLeaf; label?: string }) {
  const left = doc.examDate ? daysBetween(today(), doc.examDate) : null
  return (
    <div className="row between">
      <label className="row small" style={{ gap: 8 }}>
        <span className="label">{label}</span>
        <input type="date" value={doc.examDate} onChange={e => { const v = e.target.value; set(x => { x.examDate = v }) }} style={{ width: 'auto' }} />
      </label>
      {left != null && <span className="flag" style={{ fontSize: 14 }}>{left > 0 ? `${left} days left` : left === 0 ? 'Today' : 'Done'}</span>}
    </div>
  )
}

/* ---------- drug deck (spaced revision) ---------- */
const STEPS = [1, 3, 7, 14, 30, 60, 120]
export function DrugDeck() {
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
    <Sec title="Drug deck" sub="Each drug comes back for revision after 1, 3, 7, 14, 30 days and so on" right={<span className="small dim">{due.length} due · {mastered} mastered</span>}>
      {due.length ? (
        <ul className="list">{due.slice(0, 12).map(x => <DrugRow key={x.id} x={x} onReview={review} />)}</ul>
      ) : <p className="empty">{deck.items.length ? 'Nothing due today.' : 'Add the drugs you are learning.'}</p>}
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
                <span className="small dim" style={{ padding: '10px 0', flex: 'none' }}>next {nice(x.next, { day: 'numeric', month: 'short' })}</span>
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
      <span style={{ padding: '8px 0' }}><b style={{ fontWeight: 700 }}>{x.name}</b> <span className="dim small">{x.cls}</span></span>
      <span className="row" style={{ flex: 'none', gap: 6 }}>
        <button className="btn small" onClick={() => onReview(x.id, false)}>Forgot</button>
        <button className="btn small primary" onClick={() => onReview(x.id, true)}>Knew it</button>
      </span>
    </li>
  )
}

/* ---------- people ---------- */
export function People() {
  const [p, setP] = useDoc(K.people, D.people)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const t = today()
  const sorted = [...p.items].sort((a, b) => (a.last || '0').localeCompare(b.last || '0'))
  return (
    <Sec title="Good people" sub="Who you want to stay close to. The longest since you talked comes first.">
      {sorted.length ? (
        <ul className="list">
          {sorted.map(x => {
            const ago = x.last ? daysBetween(x.last, t) : null
            return (
              <li key={x.id} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ padding: '8px 0' }}>
                  <div style={{ fontWeight: 600 }}>{x.name} {ago != null && ago >= 30 && <span className="flag">{ago} days</span>}</div>
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
      ) : <p className="empty">Add friends, mentors and people who lift you up.</p>}
      <form className="form" onSubmit={e => {
        e.preventDefault()
        if (!name.trim()) return
        setP(d => { d.items.push({ id: uid(), name: name.trim(), note: note.trim(), last: '' }) })
        setName('')
        setNote('')
      }}>
        <label className="field"><span className="label">Name</span><input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={60} /></label>
        <label className="field"><span className="label">Who they are</span><input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Friend from college" maxLength={80} /></label>
        <button className="btn">Add</button>
      </form>
    </Sec>
  )
}
