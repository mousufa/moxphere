import { useRef, useState } from 'react'
import { CalendarCheck, PenLine, Settings, Timer } from 'lucide-react'
import { D, K, type BranchId } from '../lib/model'
import { longDate } from '../lib/date'
import { get, useStore } from '../lib/store'
import { balance } from '../lib/stats'
import { useSync } from '../lib/sync'
import { Bars, Sec, useToday } from '../ui/bits'
import { MindMap } from '../ui/mindmap'
import { Wheel } from '../ui/wheel'
import { openLog } from '../ui/logs'
import { StudyNudge } from './Today'

const greet = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Home({ open }: { open: BranchId | null }) {
  useStore()
  const t = useToday()
  const sync = useSync()
  const plan = get(K.plan(t), D.plan).items
  const bal = balance(t)
  const [o, setO] = useState<BranchId | null>(open)
  const mapRef = useRef<HTMLDivElement>(null)
  const setOpen = (b: BranchId | null) => {
    setO(b)
    history.replaceState(null, '', b ? `#home/${b}` : '#home')
  }
  const syncText = sync.status === 'synced' ? 'Synced' : sync.status === 'local' ? 'Saved on this device only' : sync.status === 'signedout' ? 'Sign in to sync' : 'Syncing'
  return (
    <div className="stack">
      <section className="top">
        <div className="top-text">
          <p className="dim">{longDate(t)}</p>
          <h1>{greet()}, Mousufa</h1>
          <p className="dim">Everything you look after, in one wheel. Tap a slice to open it.</p>
          <div className="quick">
            <a className="btn primary" href="#today"><CalendarCheck size={18} aria-hidden="true" /> Today's plan{plan.length ? ` · ${plan.filter(i => i.done).length}/${plan.length}` : ''}</a>
            <button className="btn" onClick={() => openLog({ area: 'learning' })}><PenLine size={18} aria-hidden="true" /> Log it</button>
            <a className="btn" href="#focus"><Timer size={18} aria-hidden="true" /> Focus</a>
          </div>
        </div>
        <Wheel onPick={b => {
          setOpen(b)
          requestAnimationFrame(() => mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
        }} />
      </section>
      <StudyNudge />
      <div ref={mapRef} style={{ scrollMarginTop: 12 }}>
        <MindMap name="Mousufa" open={o} setOpen={setOpen} />
      </div>
      <Sec title="This week" sub="Days you looked after each part of your life">
        <Bars rows={bal.map(a => ({
          key: a.id, name: a.name, v: a.active, max: 7, href: '#home/' + a.id,
          val: `${a.active}/${a.days} days`,
          flag: a.since == null ? 'Not started' : a.since >= 4 ? `${a.since} days ago` : undefined,
        }))} />
      </Sec>
      <a className="btn" href="#settings" style={{ justifySelf: 'start' }}><Settings size={18} aria-hidden="true" /> Settings · {syncText}</a>
    </div>
  )
}
