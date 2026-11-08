import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Toast, toast } from './ui/bits'
import { LogDialog } from './ui/logs'
import { setTimerToast, useTimer, clock, remaining } from './lib/timer'
import { BRANCHES, type BranchId } from './lib/model'
import { findLeaf } from './lib/stats'
import Home from './pages/Home'
import Today from './pages/Today'
import Journal from './pages/Journal'
import Me from './pages/Me'
import Audit from './pages/Audit'
import Focus from './pages/Focus'
import Settings from './pages/Settings'
import Drains from './pages/Drains'
import LeafPage from './pages/Leaf'

const PAGES: Record<string, { title: string; el: () => React.ReactElement }> = {
  today: { title: "Today's plan", el: Today },
  journal: { title: 'Journal', el: Journal },
  me: { title: 'Me, by me', el: Me },
  audit: { title: 'Weekly audit', el: Audit },
  focus: { title: 'Focus timer', el: Focus },
  drains: { title: 'Zero-return time', el: Drains },
  settings: { title: 'Settings', el: Settings },
}

function useHash() {
  const read = () => location.hash.replace(/^#\/?/, '') || 'home'
  const [h, setH] = useState(read)
  useEffect(() => {
    const f = () => {
      setH(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return h
}

export default function App() {
  const hash = useHash()
  const t = useTimer()
  useEffect(() => {
    setTimerToast(toast)
  }, [])

  const [a, b] = hash.split('/')
  const isBranch = (x?: string): x is BranchId => !!x && BRANCHES.some(br => br.id === x)
  let view: React.ReactElement
  let title = 'Moxphere'
  let back: string | null = null
  if (PAGES[a]) {
    const P = PAGES[a].el
    view = <P />
    title = PAGES[a].title
    back = a === 'settings' ? '#home' : '#home/control'
  } else if (isBranch(a) && b && findLeaf(b)) {
    view = <LeafPage key={b} id={b} />
    title = findLeaf(b)!.l.name
    back = `#home/${a}`
  } else {
    view = <Home open={a === 'home' && isBranch(b) ? b : isBranch(a) ? a : null} />
  }
  useEffect(() => {
    document.title = title === 'Moxphere' ? title : `${title} · Moxphere`
  }, [title])

  return (
    <div className="shell">
      <header className="appbar">
        {back ? (
          <a className="back" href={back}><ArrowLeft size={18} aria-hidden="true" /> Back to map</a>
        ) : (
          <a className="brand" href="#home">Moxphere</a>
        )}
        {t.endsAt && a !== 'focus' && (
          <a className="pill" href="#focus" aria-label="Focus timer running">{t.mode === 'focus' ? 'Focus' : 'Break'} {clock(remaining(t))}</a>
        )}
      </header>
      <main className="main" key={a + (back ? '/' + b : '')}>{view}</main>
      <LogDialog />
      <Toast />
    </div>
  )
}
