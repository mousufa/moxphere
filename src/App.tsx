import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Toast, toast } from './ui/bits'
import { LogDialog } from './ui/logs'
import { setTimerToast, useTimer, clock, remaining } from './lib/timer'
import Home from './pages/Home'
import Today from './pages/Today'
import Health from './pages/Health'
import Study from './pages/Study'
import Social from './pages/Social'
import Akhira from './pages/Akhira'
import SelfCare from './pages/SelfCare'
import Hustles from './pages/Hustles'
import Journal from './pages/Journal'
import Me from './pages/Me'
import Audit from './pages/Audit'
import Focus from './pages/Focus'
import Settings from './pages/Settings'

const PAGES: Record<string, { title: string; el: () => React.ReactElement }> = {
  home: { title: 'Home', el: Home },
  today: { title: "Today's plan", el: Today },
  health: { title: 'Health', el: Health },
  study: { title: 'Study', el: Study },
  social: { title: 'Social self', el: Social },
  akhira: { title: 'Akhira', el: Akhira },
  selfcare: { title: 'Self care', el: SelfCare },
  hustles: { title: 'Side hustles', el: Hustles },
  journal: { title: 'Journal', el: Journal },
  me: { title: 'Me, by me', el: Me },
  audit: { title: 'Weekly audit', el: Audit },
  focus: { title: 'Focus timer', el: Focus },
  settings: { title: 'Settings', el: Settings },
}

function useRoute() {
  const read = () => location.hash.replace(/^#\/?/, '').split('?')[0] || 'home'
  const [r, setR] = useState(read)
  useEffect(() => {
    const f = () => {
      setR(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return PAGES[r] ? r : 'home'
}

export default function App() {
  const route = useRoute()
  const t = useTimer()
  useEffect(() => {
    setTimerToast(toast)
  }, [])
  useEffect(() => {
    document.title = route === 'home' ? 'Moxphere' : `${PAGES[route].title} · Moxphere`
  }, [route])
  const Page = PAGES[route].el
  return (
    <div className="shell">
      <header className="appbar">
        {route === 'home' ? (
          <a className="brand" href="#home">Moxphere</a>
        ) : (
          <a className="back" href="#home"><ArrowLeft size={18} aria-hidden="true" /> Home</a>
        )}
        {t.endsAt && route !== 'focus' && (
          <a className="pill" href="#focus" aria-label="Focus timer running">{t.mode === 'focus' ? 'Focus' : 'Break'} {clock(remaining(t))}</a>
        )}
      </header>
      <main className="main">
        <Page key={route} />
      </main>
      <LogDialog />
      <Toast />
    </div>
  )
}
