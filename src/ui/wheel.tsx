import { useState } from 'react'
import { BRANCHES, D, K, type BranchId } from '../lib/model'
import { today, weekDays } from '../lib/date'
import { get, useStore } from '../lib/store'
import { activeDays, daysSince, drainMins, focusMins, score } from '../lib/stats'
import { ICONS } from './mindmap'

/** Audit & self-control has no score of its own: count days you planned, focused or journaled. */
const controlScore = (d: string) =>
  get(K.plan(d), D.plan).items.filter(i => i.done).length + (focusMins(d) > 0 ? 1 : 0) + (drainMins(d) > 0 ? 1 : 0) +
  (get(K.journal(d), D.journal).text.trim() ? 1 : 0)
const branchScore = (id: BranchId, d: string) => (id === 'control' ? controlScore(d) : score(id, d))

const R0 = 50, R1 = 142, GAP = 1.6
const SHORT: Record<BranchId, string> = {
  learning: 'Learning', project: 'Project', building: 'Building', research: 'Research', career: 'Career',
  akhira: 'Akhira', self: 'Self', joy: 'Joy', health: 'Health', control: 'Audit',
}
const pt = (r: number, a: number) => {
  const t = ((a - 90) * Math.PI) / 180
  return `${(r * Math.cos(t)).toFixed(2)},${(r * Math.sin(t)).toFixed(2)}`
}
const wedge = (r0: number, r1: number, a0: number, a1: number) => {
  const big = a1 - a0 > 180 ? 1 : 0
  return `M${pt(r1, a0)} A${r1},${r1} 0 ${big} 1 ${pt(r1, a1)} L${pt(r0, a1)} A${r0},${r0} 0 ${big} 0 ${pt(r0, a0)} Z`
}

export function Wheel({ onPick }: { onPick: (b: BranchId) => void }) {
  useStore()
  const [hover, setHover] = useState<BranchId | null>(null)
  const t = today()
  const days = weekDays(t).filter(d => d <= t)
  const n = BRANCHES.length
  const step = 360 / n
  const data = BRANCHES.map(b => ({
    b,
    active: activeDaysFor(b.id, days),
    since: daysSince(d => branchScore(b.id, d)),
  }))
  const cared = data.filter(x => x.active > 0).length
  const h = data.find(x => x.b.id === hover)
  return (
    <div className="wheel" onMouseLeave={() => setHover(null)}>
      <svg viewBox="-150 -150 300 300" role="group" aria-label="Wheel of your life this week">
        <g className="wheel-spin">
          {data.map(({ b, active }, i) => {
            const a0 = i * step + GAP / 2, a1 = (i + 1) * step - GAP / 2
            const fill = R0 + (R1 - R0) * (active / days.length || 0)
            const mid = (a0 + a1) / 2
            const Icon = ICONS[b.id]
            const [ix, iy] = pt((R0 + R1) / 2 + 12, mid).split(',').map(Number)
            return (
              <g key={b.id} className={'slice' + (hover === b.id ? ' on' : '')} role="button" tabIndex={0}
                aria-label={`${b.name}: looked after ${active} of ${days.length} days this week. Open.`}
                onMouseEnter={() => setHover(b.id)} onFocus={() => setHover(b.id)} onBlur={() => setHover(null)}
                onClick={() => onPick(b.id)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPick(b.id))}>
                <path d={wedge(R0, R1, a0, a1)} className={'base' + (i % 2 ? ' alt' : '')} />
                {active > 0 && <path d={wedge(R0, fill, a0, a1)} className="fill" />}
                <g transform={`translate(${ix - 30} ${iy - 20})`}>
                  <g className="wheel-icon">
                    <rect width="60" height="40" fill="transparent" />
                    <Icon x={19} y={0} width={22} height={22} strokeWidth={2} />
                    <text x={30} y={36} textAnchor="middle" className="wheel-label">{SHORT[b.id]}</text>
                  </g>
                </g>
              </g>
            )
          })}
        </g>
      </svg>
      <div className="wheel-center" aria-live="polite">
        {h ? (
          <>
            <b>{h.b.name}</b>
            <span>{h.active}/{days.length} days</span>
            {h.since != null && h.since >= 4 && <span className="q">{h.since} days quiet</span>}
            {h.since == null && <span className="q">Not started</span>}
          </>
        ) : (
          <>
            <b>{cared} of {n}</b>
            <span>looked after this week</span>
          </>
        )}
      </div>
    </div>
  )
}
const activeDaysFor = (id: BranchId, days: string[]) => (id === 'control' ? days.filter(d => controlScore(d) > 0).length : activeDays(id, days))
