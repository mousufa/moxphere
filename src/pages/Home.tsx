import { useState } from 'react'
import { CalendarCheck, PenLine, Settings, Timer } from 'lucide-react'
import { D, K, type BranchId } from '../lib/model'
import { longDate } from '../lib/date'
import { get, useStore } from '../lib/store'
import { balance } from '../lib/stats'
import { useSync } from '../lib/sync'
import { Bars, Sec, useToday } from '../ui/bits'
import { MindMap } from '../ui/mindmap'
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
  const setOpen = (b: BranchId | null) => history.replaceState(null, '', b ? `#home/${b}` : '#home')
  const syncText = sync.status === 'synced' ? 'Synced' : sync.status === 'local' ? 'Saved on this device only' : sync.status === 'signedout' ? 'Sign in to sync' : 'Syncing'
  return (
    <div className="stack">
      <header className="hello">
        <p className="dim">{longDate(t)}</p>
        <h1>{greet()}, Mousufa</h1>
      </header>
      <StudyNudge />
      <div className="quick">
        <a className="btn primary" href="#today"><CalendarCheck size={18} aria-hidden="true" /> Today's plan{plan.length ? ` · ${plan.filter(i => i.done).length}/${plan.length}` : ''}</a>
        <button className="btn" onClick={() => openLog({ area: 'learning' })}><PenLine size={18} aria-hidden="true" /> Log it</button>
        <a className="btn" href="#focus"><Timer size={18} aria-hidden="true" /> Focus</a>
      </div>
      <MapState open={open} setOpen={setOpen} />
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

function MapState({ open, setOpen }: { open: BranchId | null; setOpen: (b: BranchId | null) => void }) {
  const [o, setO] = useState<BranchId | null>(open)
  return <MindMap name="Mousufa" open={o} setOpen={b => { setO(b); setOpen(b) }} />
}
