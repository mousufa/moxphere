import { useState } from 'react'
import { D, DEFAULT_CONFIG, K, VIDEO_STAGES, type Hustle, type TaskStatus, type Track } from '../lib/model'
import { lastDays, mins, nice, today, uid, weekDays } from '../lib/date'
import { useDoc, useStore } from '../lib/store'
import { config, minutes, score, sumDays, tracksOf } from '../lib/stats'
import { Heat, PH, Sec, Tiles } from '../ui/bits'
import { LogList, openLog } from '../ui/logs'

const KIND = { service: 'Service business', product: 'Product business', channel: 'YouTube channel', other: 'Side project' }
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export default function Hustles() {
  useStore()
  const hs = tracksOf('hustles')
  const [sel, setSel] = useState(hs[0]?.id ?? '')
  const cur = hs.find(h => h.id === sel) ?? hs[0]
  const t = today()
  const week = weekDays(t).filter(d => d <= t)
  return (
    <div className="stack">
      <PH title="Baa pani edukkam" sub="Pinned, WhyPharm and the WhyPharm channel"
        right={<button className="btn primary" onClick={() => openLog({ area: 'hustles', track: cur?.id })}>Log work</button>} />
      <Tiles four items={[
        { label: 'This week', value: mins(sumDays(week, d => minutes('hustles', d))) },
        ...hs.slice(0, 3).map(h => ({ label: h.name, value: mins(sumDays(week, d => minutes('hustles', d, h.id))), sub: 'this week' })),
      ]} />
      <div className="seg" role="tablist" aria-label="Hustles">
        {hs.map(h => <button key={h.id} role="tab" aria-selected={h.id === cur?.id} aria-pressed={h.id === cur?.id} onClick={() => setSel(h.id)}>{h.name}</button>)}
      </div>
      {cur && <HustleView key={cur.id} h={cur} />}
      <AddHustle onAdd={setSel} />
      <Sec title="Consistency, all hustles"><Heat value={d => score('hustles', d)} label={d => `${nice(d)} · ${mins(minutes('hustles', d))}`} /></Sec>
    </div>
  )
}

function HustleView({ h }: { h: Track }) {
  const [doc, setDoc] = useDoc(K.hustle(h.id), D.hustle)
  const month = lastDays(30)
  const inc = doc.money.filter(m => m.kind === 'in' && month.includes(m.date)).reduce((a, m) => a + m.amt, 0)
  const out = doc.money.filter(m => m.kind === 'out' && month.includes(m.date)).reduce((a, m) => a + m.amt, 0)
  return (
    <div className="stack">
      <div className="row between">
        <div>
          <h2 style={{ font: '400 34px/1.1 var(--display)' }}>{h.name}</h2>
          <p className="dim">{KIND[h.kind ?? 'other']}</p>
        </div>
        <Tiles items={[
          { label: 'Open tasks', value: doc.tasks.filter(x => x.status !== 'done').length },
          h.kind === 'channel'
            ? { label: 'Published', value: doc.videos.filter(v => v.stage === 4).length }
            : { label: 'Net, 30 days', value: inr(inc - out) },
        ]} />
      </div>
      <Tasks doc={doc} setDoc={setDoc} />
      <div className="cols even">
        {h.kind === 'channel' ? <Videos doc={doc} setDoc={setDoc} /> : <MoneyLog doc={doc} setDoc={setDoc} />}
        <div className="stack">
          <Sec title="Notes" sub="Ideas, clients, suppliers, what's working">
            <textarea value={doc.note} onChange={e => { const v = e.target.value; setDoc(x => { x.note = v }) }} aria-label={`Notes for ${h.name}`} />
          </Sec>
          <Sec title="Work log"><LogList area="hustles" track={h.id} days={lastDays(60)} empty="No work logged in the last 60 days." /></Sec>
        </div>
      </div>
    </div>
  )
}

type SetDoc = (f: (d: Hustle) => void) => void
const COLS: [TaskStatus, string][] = [['todo', 'To do'], ['doing', 'Doing'], ['done', 'Done']]

function Tasks({ doc, setDoc }: { doc: Hustle; setDoc: SetDoc }) {
  const [v, setV] = useState('')
  const move = (id: string, s: TaskStatus) => setDoc(x => { const it = x.tasks.find(i => i.id === id); if (it) it.status = s })
  return (
    <Sec title="Tasks">
      <form className="row" onSubmit={e => {
        e.preventDefault()
        if (!v.trim()) return
        setDoc(x => { x.tasks.push({ id: uid(), t: v.trim(), status: 'todo' }) })
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
                    <span style={{ padding: '8px 0', overflowWrap: 'anywhere', color: s === 'done' ? 'var(--dim)' : undefined }}>{x.t}</span>
                    {s !== 'todo' && <button className="x" aria-label={`Move ${x.t} back`} onClick={() => move(x.id, s === 'done' ? 'doing' : 'todo')}>←</button>}
                    {s !== 'done' && <button className="x" aria-label={`Move ${x.t} forward`} onClick={() => move(x.id, s === 'todo' ? 'doing' : 'done')}>→</button>}
                    <button className="x" aria-label={`Remove ${x.t}`} onClick={() => setDoc(d => { d.tasks = d.tasks.filter(i => i.id !== x.id) })}>×</button>
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

function MoneyLog({ doc, setDoc }: { doc: Hustle; setDoc: SetDoc }) {
  const [amt, setAmt] = useState('')
  const [note, setNote] = useState('')
  const [kind, setKind] = useState<'in' | 'out'>('in')
  const all = [...doc.money].sort((a, b) => b.date.localeCompare(a.date))
  const total = (k: 'in' | 'out') => doc.money.filter(m => m.kind === k).reduce((a, m) => a + m.amt, 0)
  return (
    <Sec title="Money" right={<span className="mono small dim">All time {inr(total('in') - total('out'))}</span>}>
      <form className="form" onSubmit={e => {
        e.preventDefault()
        const n = Number(amt)
        if (!n) return
        setDoc(x => { x.money.push({ id: uid(), date: today(), amt: Math.abs(n), kind, note: note.trim() }) })
        setAmt('')
        setNote('')
      }}>
        <label className="field" style={{ flex: '0 1 110px' }}><span className="label">Type</span>
          <select value={kind} onChange={e => setKind(e.target.value as 'in' | 'out')}><option value="in">Income</option><option value="out">Expense</option></select>
        </label>
        <label className="field" style={{ flex: '0 1 120px' }}><span className="label">Amount ₹</span><input type="number" inputMode="decimal" min={0} value={amt} onChange={e => setAmt(e.target.value)} /></label>
        <label className="field"><span className="label">For</span><input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Client, order, supplies" maxLength={120} /></label>
        <button className="btn">Add</button>
      </form>
      {all.length ? (
        <ul className="list">
          {all.slice(0, 30).map(m => (
            <li key={m.id}>
              <span style={{ padding: '8px 0' }}><span className="mono dim small">{nice(m.date)}</span> {m.note}</span>
              <span className="mono" style={{ padding: '8px 0', flex: 'none' }}>{m.kind === 'in' ? '+' : '−'}{inr(m.amt)}</span>
              <button className="x" aria-label="Remove entry" onClick={() => setDoc(d => { d.money = d.money.filter(i => i.id !== m.id) })}>×</button>
            </li>
          ))}
        </ul>
      ) : <p className="empty">Log income and expenses to see if it's paying off.</p>}
    </Sec>
  )
}

function Videos({ doc, setDoc }: { doc: Hustle; setDoc: SetDoc }) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('Pharmacotherapeutics')
  const order = [...doc.videos].sort((a, b) => a.stage - b.stage)
  return (
    <Sec title="Videos" sub="Teach what you study. Each video is revision and an asset.">
      <form className="form" onSubmit={e => {
        e.preventDefault()
        if (!title.trim()) return
        setDoc(x => { x.videos.push({ id: uid(), title: title.trim(), subject: subject.trim(), stage: 0 }) })
        setTitle('')
      }}>
        <label className="field"><span className="label">Video</span><input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Heart failure drugs in 10 minutes" maxLength={140} /></label>
        <label className="field"><span className="label">Subject</span><input type="text" value={subject} onChange={e => setSubject(e.target.value)} maxLength={60} /></label>
        <button className="btn">Add</button>
      </form>
      {order.length ? (
        <ul className="list">
          {order.map(v => (
            <li key={v.id} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ padding: '8px 0', minWidth: 160 }}>
                <div>{v.title}</div>
                <div className="small dim">{v.subject} · {VIDEO_STAGES[v.stage]}</div>
                <div className="stage" aria-hidden="true">{VIDEO_STAGES.map((s, i) => <i key={s} className={i <= v.stage ? 'on' : ''} />)}</div>
              </div>
              <span className="row" style={{ flex: 'none', gap: 2 }}>
                <button className="x" disabled={v.stage === 0} aria-label="Back a stage" onClick={() => setDoc(d => { const it = d.videos.find(i => i.id === v.id); if (it) it.stage = Math.max(0, it.stage - 1) })}>←</button>
                {v.stage < 4 && <button className="btn small" onClick={() => setDoc(d => { const it = d.videos.find(i => i.id === v.id); if (it) it.stage++ })}>{VIDEO_STAGES[v.stage + 1]} →</button>}
                <button className="x" aria-label={`Remove ${v.title}`} onClick={() => setDoc(d => { d.videos = d.videos.filter(i => i.id !== v.id) })}>×</button>
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="empty">Add your first video idea. Stages go Idea, Script, Record, Edit, Published.</p>}
    </Sec>
  )
}

function AddHustle({ onAdd }: { onAdd: (id: string) => void }) {
  const [, setCfg] = useDoc(K.config, DEFAULT_CONFIG)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<Track['kind']>('other')
  return (
    <form className="form" onSubmit={e => {
      e.preventDefault()
      if (!name.trim()) return
      const id = uid()
      setCfg(c => { c.tracks = [...config().tracks, { id, area: 'hustles', name: name.trim(), kind }] })
      setName('')
      onAdd(id)
    }}>
      <label className="field"><span className="label">Start something new</span><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" maxLength={60} /></label>
      <label className="field" style={{ flex: '0 1 180px' }}><span className="label">Kind</span>
        <select value={kind} onChange={e => setKind(e.target.value as Track['kind'])}>
          {Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <button className="btn">Add</button>
    </form>
  )
}
