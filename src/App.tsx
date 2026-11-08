import { useEffect, useState } from 'react'
import { Toast, toast } from './ui/bits'
import { LogDialog } from './ui/logs'
import { setTimerToast, useTimer, clock, remaining } from './lib/timer'
import { useSync } from './lib/sync'
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
import Areas from './pages/Areas'

const PAGES: Record<string, { title: string; el: () => React.ReactElement }> = {
  today: { title: 'Today', el: Today },
  health: { title: 'Health', el: Health },
  study: { title: 'Korach padikkam', el: Study },
  social: { title: 'Social self', el: Social },
  akhira: { title: 'Akhira', el: Akhira },
  selfcare: { title: 'Self care', el: SelfCare },
  hustles: { title: 'Baa pani edukkam', el: Hustles },
  journal: { title: 'Journal', el: Journal },
  me: { title: 'Me, by me', el: Me },
  audit: { title: 'Audit', el: Audit },
  focus: { title: 'Focus', el: Focus },
  settings: { title: 'Settings', el: Settings },
  areas: { title: 'Areas', el: Areas },
}
const SIDE: (string | null)[] = ['today', null, 'health', 'study', 'social', 'akhira', 'selfcare', 'hustles', null, 'journal', 'me', 'audit', 'focus', null, 'settings']
const TABS: [string, string][] = [
  ['today', 'Today'], ['areas', 'Areas'], ['focus', 'Focus'], ['journal', 'Journal'], ['audit', 'Audit'],
]
const AREA_PAGES = ['health', 'study', 'social', 'akhira', 'selfcare', 'hustles', 'me', 'settings']

function useRoute() {
  const read = () => location.hash.replace(/^#\/?/, '').split('?')[0] || 'today'
  const [r, setR] = useState(read)
  useEffect(() => {
    const f = () => {
      setR(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return PAGES[r] ? r : 'today'
}

const SYNC_TEXT = {
  local: 'On this device only',
  signedout: 'Sync is off: sign in',
  syncing: 'Syncing…',
  synced: 'Synced',
  offline: 'Offline, will sync later',
  error: 'Sync problem',
}

export default function App() {
  const route = useRoute()
  const t = useTimer()
  const sync = useSync()
  useEffect(() => {
    setTimerToast(toast)
  }, [])
  useEffect(() => {
    document.title = `${PAGES[route].title} · Moxphere`
  }, [route])
  const Page = PAGES[route].el
  const tabFor = AREA_PAGES.includes(route) ? 'areas' : route
  return (
    <div className="shell">
      <nav className="side" aria-label="Main">
        <a className="brand" href="#today">Moxphere</a>
        {SIDE.map((k, i) =>
          k ? (
            <a key={k} className="nav" href={'#' + k} aria-current={route === k ? 'page' : undefined}>{PAGES[k].title}</a>
          ) : (
            <div key={'s' + i} className="sep" />
          ),
        )}
        <a className="foot" href="#settings">{SYNC_TEXT[sync.status]}</a>
      </nav>
      <main className="main">
        {t.endsAt && route !== 'focus' && (
          <div className="topbar">
            <a className="pill" href="#focus" aria-label="Focus timer running">{t.mode === 'focus' ? 'Focus' : 'Break'} {clock(remaining(t))}</a>
          </div>
        )}
        <Page key={route} />
      </main>
      <nav className="tabs" aria-label="Main">
        {TABS.map(([k, label]) => (
          <a key={k} href={'#' + k} aria-current={tabFor === k ? 'page' : undefined}>{label}</a>
        ))}
      </nav>
      <LogDialog />
      <Toast />
    </div>
  )
}
