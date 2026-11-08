import { useState } from 'react'
import { D, K, type PlanItem } from '../lib/model'
import { hourLabel, shift, today, uid } from '../lib/date'
import { get, update, useDoc } from '../lib/store'
import { Check } from './bits'

/** Hour-by-hour plan for one day. */
export function Plan({ date }: { date: string }) {
  const [plan, setPlan] = useDoc(K.plan(date), D.plan)
  const isToday = date === today()
  const nowH = isToday ? new Date().getHours() : -1
  const prevUndone = isToday ? get(K.plan(shift(date, -1)), D.plan).items.filter(i => !i.done) : []
  const hours = new Set<number>()
  for (let h = 5; h < 24; h++) hours.add(h)
  plan.items.forEach(i => i.h != null && hours.add(i.h))
  const slots: (number | null)[] = [null, ...[...hours].sort((a, b) => a - b)]

  const carry = () => {
    update(K.plan(shift(date, -1)), D.plan, p => {
      p.items = p.items.filter(i => i.done)
    })
    setPlan(p => {
      p.items.push(...prevUndone)
    })
  }
  return (
    <div className="sec" style={{ gap: 10 }}>
      <div className="row between">
        {prevUndone.length > 0 ? (
          <button className="btn small" onClick={carry}>Bring {prevUndone.length} unfinished from yesterday</button>
        ) : <span />}
        {nowH >= 5 && (
          <button className="btn small" onClick={() => document.getElementById('slot-' + nowH)?.scrollIntoView({ block: 'start' })}>Go to this hour</button>
        )}
      </div>
      <div className="tl">
        {slots.map(h => (
          <Slot key={String(h)} h={h} now={h === nowH} items={plan.items.filter(i => (i.h ?? null) === h)} setPlan={setPlan} />
        ))}
      </div>
    </div>
  )
}

function Slot({ h, now, items, setPlan }: { h: number | null; now: boolean; items: PlanItem[]; setPlan: (f: (p: typeof D.plan) => void) => void }) {
  const [v, setV] = useState('')
  const lab = h == null ? 'Anytime' : hourLabel(h)
  const id = 'slot-' + (h ?? 'any')
  return (
    <div className={'slot' + (now ? ' now' : '')} id={id}>
      <span className="hr">{lab}</span>
      <div>
        {items.length > 0 && (
          <ul className="list">
            {items.map(it => (
              <li key={it.id}>
                <Check checked={it.done} onChange={c => setPlan(p => { const x = p.items.find(i => i.id === it.id); if (x) x.done = c })}>{it.t}</Check>
                <select className="mv" value="" aria-label={`Move ${it.t} to another hour`} onChange={e => {
                  const val = e.target.value
                  if (!val) return
                  setPlan(p => {
                    const x = p.items.find(i => i.id === it.id)
                    if (!x) return
                    if (val === 'any') delete x.h
                    else x.h = Number(val)
                  })
                }}>
                  <option value="">Move</option>
                  {h != null && <option value="any">Anytime</option>}
                  {Array.from({ length: 24 }, (_, k) => k).filter(k => k !== h).map(k => <option key={k} value={k}>{hourLabel(k)}</option>)}
                </select>
                <button className="x" aria-label={`Remove ${it.t}`} onClick={() => setPlan(p => { p.items = p.items.filter(i => i.id !== it.id) })}>×</button>
              </li>
            ))}
          </ul>
        )}
        <form className="hform" onSubmit={e => {
          e.preventDefault()
          if (!v.trim()) return
          const item: PlanItem = { id: uid(), t: v.trim(), done: false }
          if (h != null) item.h = h
          setPlan(p => { p.items.push(item) })
          setV('')
        }}>
          <input type="text" value={v} onChange={e => setV(e.target.value)} placeholder="Add" aria-label={`Add a plan for ${lab}`} maxLength={300} />
          <button className="x" aria-label={`Add to ${lab}`}>+</button>
        </form>
      </div>
    </div>
  )
}
