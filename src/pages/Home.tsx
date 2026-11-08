import type { LucideIcon } from 'lucide-react'
import { BookOpen, Briefcase, CalendarCheck, ChartColumn, Flower2, HeartPulse, MessagesSquare, Moon, NotebookPen, Settings, Sparkles, Timer } from 'lucide-react'
import { D, K, type AreaId } from '../lib/model'
import { longDate, mins, weekDays } from '../lib/date'
import { get, useStore } from '../lib/store'
import { balance, daysSince, logsFor, minutes, prayed, sumDays } from '../lib/stats'
import { active, clock, remaining, useTimer } from '../lib/timer'
import { useSync } from '../lib/sync'
import { Bars, Sec, useToday } from '../ui/bits'
import { StudyNudge } from './Today'

interface Block { href: string; title: string; sub: string; stat: string; icon: LucideIcon; area?: AreaId; big?: boolean }

const greet = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Home() {
  useStore()
  const t = useToday()
  const timer = useTimer()
  const sync = useSync()
  const week = weekDays(t).filter(d => d <= t)
  const plan = get(K.plan(t), D.plan).items
  const h = get(K.health(t), D.health)
  const { onTime } = prayed(t)
  const since = (a: AreaId) => daysSince(a)
  const ago = (n: number | null) => (n == null ? 'Not started yet' : n === 0 ? 'Done today' : n === 1 ? 'Last: yesterday' : `Last: ${n} days ago`)
  const journal = get(K.journal(t), { text: '' }).text.trim()
  const bal = balance(t)

  const blocks: Block[] = [
    { href: '#today', title: "Today's plan", sub: 'Hour by hour, check-in and zero-return time', icon: CalendarCheck, big: true,
      stat: plan.length ? `${plan.filter(i => i.done).length} of ${plan.length} done` : 'Nothing planned yet' },
    { href: '#health', area: 'health', title: 'Health', sub: 'Sleep, water, movement, mood', icon: HeartPulse,
      stat: h.sleep != null || h.water != null ? [h.sleep != null && `${h.sleep}h sleep`, h.water != null && `${h.water} glasses`].filter(Boolean).join(' · ') : 'Check in for today' },
    { href: '#study', area: 'study', title: 'Study', sub: 'Pharma, career and tech', icon: BookOpen,
      stat: `${mins(minutes('study', t))} today · ${mins(sumDays(week, d => minutes('study', d)))} this week` },
    { href: '#social', area: 'social', title: 'Social self', sub: 'Communication and confidence', icon: MessagesSquare,
      stat: `${sumDays(week, d => logsFor('social', d).length)} moments this week` },
    { href: '#akhira', area: 'akhira', title: 'Akhira', sub: 'Spiritual goals', icon: Moon,
      stat: `${onTime} of 5 prayers on time today` },
    { href: '#selfcare', area: 'selfcare', title: 'Self care', sub: 'Trips, cooking, food, making things', icon: Flower2,
      stat: ago(since('selfcare')) },
    { href: '#hustles', area: 'hustles', title: 'Side hustles', sub: 'Pinned, WhyPharm, YouTube', icon: Briefcase,
      stat: `${mins(sumDays(week, d => minutes('hustles', d)))} this week` },
    { href: '#journal', title: 'Journal', sub: 'Diary and daily wins', icon: NotebookPen,
      stat: journal ? 'Written today' : 'Not written today' },
    { href: '#focus', title: 'Focus timer', sub: 'Pomodoro sessions', icon: Timer,
      stat: active(timer) ? `${timer.mode === 'focus' ? 'Focusing' : 'Break'} · ${clock(remaining(timer))} left` : 'Start a session' },
    { href: '#me', title: 'Me, by me', sub: 'Who you are, in your words', icon: Sparkles, stat: 'Your own definition' },
    { href: '#audit', title: 'Weekly audit', sub: 'Balance and reflection', icon: ChartColumn,
      stat: `${bal.filter(a => a.active > 0).length} of 6 areas this week` },
  ]
  const syncText = sync.status === 'synced' ? 'Synced' : sync.status === 'local' ? 'Saved on this device only' : sync.status === 'signedout' ? 'Sign in to sync' : 'Syncing'

  return (
    <div className="stack">
      <header className="hello">
        <p className="dim">{longDate(t)}</p>
        <h1>{greet()}, Mousufa</h1>
      </header>
      <StudyNudge />
      <nav className="blocks" aria-label="Sections">
        {blocks.map(b => {
          const s = b.area ? since(b.area) : null
          const Icon = b.icon
          return (
            <a key={b.href} href={b.href} className={'block' + (b.big ? ' big' : '')}>
              <span className="ic" aria-hidden="true"><Icon size={22} strokeWidth={2} /></span>
              <span className="bt">{b.title}</span>
              <span className="bs">{b.sub}</span>
              <span className="bstat">{b.stat}</span>
              {b.area && s != null && s >= 4 && <span className="flag">{s} days quiet</span>}
            </a>
          )
        })}
      </nav>
      <Sec title="This week" sub="Days you looked after each part of your life">
        <Bars rows={bal.map(a => ({
          key: a.id, name: a.name, v: a.active, max: 7, href: '#' + a.id,
          val: `${a.active}/${a.days} days`,
          flag: a.since == null ? 'Not started' : a.since >= 4 ? `${a.since} days ago` : undefined,
        }))} />
      </Sec>
      <a className="btn" href="#settings" style={{ justifySelf: 'start' }}>
        <Settings size={18} aria-hidden="true" /> Settings · {syncText}
      </a>
    </div>
  )
}
