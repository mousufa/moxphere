import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { BookOpen, Briefcase, ClipboardCheck, Compass, FlaskConical, Heart, HeartPulse, LineChart, Moon, Plus, Smile } from 'lucide-react'
import { DEFAULT_CONFIG, K, type Branch, type BranchId } from '../lib/model'
import { today, uid, weekDays } from '../lib/date'
import { useDoc, useStore } from '../lib/store'
import { activeDays, branches, config, daysSince, score } from '../lib/stats'

export const ICONS: Record<BranchId, LucideIcon> = {
  learning: BookOpen, project: LineChart, building: Briefcase, research: FlaskConical, career: Compass,
  akhira: Moon, self: Smile, joy: Heart, health: HeartPulse, control: ClipboardCheck,
}
const leafHref = (b: Branch, l: Branch['leaves'][number]) => l.href ?? `#${b.id}/${l.id}`

function useWide() {
  const q = '(min-width: 900px)'
  const [w, setW] = useState(() => matchMedia(q).matches)
  useEffect(() => {
    const m = matchMedia(q)
    const f = () => setW(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return w
}

function stat(b: Branch) {
  if (b.id === 'control') return { text: `${b.leaves.length} tools`, quiet: null as number | null }
  const t = today()
  const days = weekDays(t).filter(d => d <= t)
  const since = daysSince(d => score(b.id, d))
  return { text: `${activeDays(b.id, days)}/${days.length} days`, quiet: since == null || since >= 4 ? since : null }
}

export function MindMap({ open, setOpen, name }: { open: BranchId | null; setOpen: (b: BranchId | null) => void; name: string }) {
  useStore()
  const wide = useWide()
  const bs = branches()
  return wide ? <Radial bs={bs} open={open} setOpen={setOpen} name={name} /> : <Tree bs={bs} open={open} setOpen={setOpen} name={name} />
}

/* ---------- laptop: root → branches → leaves, joined by curves ---------- */
function Radial({ bs, open, setOpen, name }: { bs: Branch[]; open: BranchId | null; setOpen: (b: BranchId | null) => void; name: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [paths, setPaths] = useState<{ d: string; hot: boolean; k: string }[]>([])
  const sel = bs.find(b => b.id === open) ?? null

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const draw = () => {
      const box = el.getBoundingClientRect()
      const rel = (n: Element) => {
        const r = n.getBoundingClientRect()
        return { l: r.left - box.left, r: r.right - box.left, y: r.top - box.top + r.height / 2 }
      }
      const root = el.querySelector('.mm-root')
      if (!root) return
      const R = rel(root)
      const out: { d: string; hot: boolean; k: string }[] = []
      const curve = (x1: number, y1: number, x2: number, y2: number) => {
        const dx = Math.max(30, (x2 - x1) / 2)
        return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`
      }
      el.querySelectorAll<HTMLElement>('.mm-branch').forEach(n => {
        const p = rel(n)
        out.push({ d: curve(R.r, R.y, p.l, p.y), hot: n.dataset.id === open, k: 'b' + n.dataset.id })
      })
      const on = el.querySelector(`.mm-branch[data-id="${open}"]`)
      if (on) {
        const B = rel(on)
        el.querySelectorAll('.mm-leaf').forEach((n, i) => {
          const p = rel(n)
          out.push({ d: curve(B.r, B.y, p.l, p.y), hot: true, k: `l${open}${i}` })
        })
      }
      setPaths(out)
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(el)
    return () => ro.disconnect()
  }, [open, bs.length, sel?.leaves.length])

  return (
    <div className="mm" ref={wrap}>
      <svg className="mm-lines" aria-hidden="true">
        {paths.map(p => <path key={p.k} d={p.d} className={p.hot ? 'hot' : ''} pathLength={1} />)}
      </svg>
      <div className="mm-col mm-rootcol"><div className="mm-root">{name}</div></div>
      <div className="mm-col">
        {bs.map(b => <BranchNode key={b.id} b={b} on={open === b.id} toggle={() => setOpen(open === b.id ? null : b.id)} />)}
      </div>
      <div className="mm-col mm-leaves" key={open ?? 'none'}>
        {sel ? (
          <>
            {sel.leaves.map((l, i) => (
              <a key={l.id} className="mm-leaf" href={leafHref(sel, l)} style={{ ['--i' as any]: i }}>{l.name}</a>
            ))}
            {sel.addKind && <AddLeaf b={sel} i={sel.leaves.length} />}
          </>
        ) : (
          <p className="mm-hint">Tap a branch to see what's inside.</p>
        )}
      </div>
    </div>
  )
}

function BranchNode({ b, on, toggle }: { b: Branch; on: boolean; toggle: () => void }) {
  const Icon = ICONS[b.id]
  const s = stat(b)
  return (
    <button type="button" className={'mm-branch' + (on ? ' on' : '')} data-id={b.id} aria-expanded={on} onClick={toggle}>
      <span className="ic" aria-hidden="true"><Icon size={18} /></span>
      <span className="txt">
        <b>{b.name}</b>
        <small>{s.text}</small>
      </span>
      {s.quiet != null && <span className="flag">{s.quiet}d quiet</span>}
    </button>
  )
}

/* ---------- phone: a tree that folds out ---------- */
function Tree({ bs, open, setOpen, name }: { bs: Branch[]; open: BranchId | null; setOpen: (b: BranchId | null) => void; name: string }) {
  return (
    <div className="mmv">
      <div className="mm-root">{name}</div>
      <ul className="mmv-trunk">
        {bs.map(b => (
          <li key={b.id}>
            <BranchNode b={b} on={open === b.id} toggle={() => setOpen(open === b.id ? null : b.id)} />
            {open === b.id && (
              <ul className="mmv-leaves">
                {b.leaves.map((l, i) => (
                  <li key={l.id} style={{ ['--i' as any]: i }}><a className="mm-leaf" href={leafHref(b, l)}>{l.name}</a></li>
                ))}
                {b.addKind && <li style={{ ['--i' as any]: b.leaves.length }}><AddLeaf b={b} i={b.leaves.length} /></li>}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AddLeaf({ b, i }: { b: Branch; i: number }) {
  const [, setCfg] = useDoc(K.config, DEFAULT_CONFIG)
  const [editing, setEditing] = useState(false)
  const [v, setV] = useState('')
  if (!editing)
    return (
      <button type="button" className="mm-leaf add" style={{ ['--i' as any]: i }} onClick={() => setEditing(true)}>
        <Plus size={16} aria-hidden="true" /> {b.addLabel ?? 'Add'}
      </button>
    )
  return (
    <form className="mm-leaf add editing" style={{ ['--i' as any]: i }} onSubmit={e => {
      e.preventDefault()
      if (!v.trim() || !b.addKind) return
      setCfg(c => { c.extraLeaves = [...config().extraLeaves, { branch: b.id, leaf: { id: uid(), name: v.trim(), kind: b.addKind! } }] })
      setV('')
      setEditing(false)
    }}>
      <input type="text" autoFocus value={v} onChange={e => setV(e.target.value)} placeholder="Name" aria-label={b.addLabel ?? 'Name'} maxLength={50}
        onBlur={() => !v && setEditing(false)} onKeyDown={e => e.key === 'Escape' && setEditing(false)} />
      <button className="btn small primary">Add</button>
    </form>
  )
}
