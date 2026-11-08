import { useSyncExternalStore } from 'react'
import { update } from './store'
import { D, K, type AreaId } from './model'
import { dkey, uid } from './date'
import { trackName } from './stats'

export const BREAK = 5
export interface Timer {
  area: AreaId
  track: string
  mode: 'focus' | 'break'
  dur: number
  endsAt: number | null
  left: number | null
}
const LT = 'moxphere:timer'
let T: Timer = { area: 'study', track: 'drugs', mode: 'focus', dur: 25, endsAt: null, left: null }
try {
  T = { ...T, ...JSON.parse(localStorage.getItem(LT) || '{}') }
} catch {}
const listeners = new Set<() => void>()
const set = (p: Partial<Timer>) => {
  T = { ...T, ...p }
  try {
    localStorage.setItem(LT, JSON.stringify(T))
  } catch {}
  listeners.forEach(l => l())
}
export const useTimer = () =>
  useSyncExternalStore(
    l => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    () => T,
  )
export const active = (t = T) => !!t.endsAt || t.left != null
export const planned = (t = T) => (t.mode === 'focus' ? t.dur : BREAK) * 60000
export const remaining = (t = T) => (t.endsAt ? t.endsAt - Date.now() : t.left ?? planned(t))
export const clock = (ms: number) => {
  const c = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(c / 60)).padStart(2, '0')}:${String(c % 60).padStart(2, '0')}`
}

let wake: any = null
async function holdWake() {
  try {
    wake = await (navigator as any).wakeLock?.request('screen')
  } catch {
    wake = null
  }
}
function releaseWake() {
  try {
    wake?.release()
  } catch {}
  wake = null
}

let audio: AudioContext | null = null
function unlockAudio() {
  try {
    audio = audio || new AudioContext()
    void audio.resume()
  } catch {}
}
export function chime() {
  if (!audio) return
  try {
    ;[660, 880, 990].forEach((f, i) => {
      const o = audio!.createOscillator(), g = audio!.createGain(), t = audio!.currentTime + i * 0.22
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
      o.connect(g).connect(audio!.destination)
      o.start(t)
      o.stop(t + 0.6)
    })
  } catch {}
}
export async function notify(title: string, body: string) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.showNotification(title, { body, icon: 'icon-192.png', tag: 'moxphere' })
    else new Notification(title, { body })
  } catch {}
}

export function start() {
  unlockAudio()
  try {
    if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission()
  } catch {}
  set({ endsAt: Date.now() + (T.left ?? planned()), left: null })
  void holdWake()
}
export function pause() {
  set({ left: Math.max(0, (T.endsAt ?? 0) - Date.now()), endsAt: null })
  releaseWake()
}
export function reset() {
  set({ mode: 'focus', endsAt: null, left: null })
  releaseWake()
}
export function choose(p: Partial<Pick<Timer, 'area' | 'track' | 'dur'>>) {
  if (!active()) set(p)
}

let onToast: (m: string) => void = () => {}
export const setTimerToast = (f: (m: string) => void) => (onToast = f)

function finish() {
  const { mode, dur, area, track, endsAt } = T
  set({ endsAt: null, left: null, mode: mode === 'focus' ? 'break' : 'focus' })
  releaseWake()
  chime()
  if (mode === 'focus') {
    const d = dkey(new Date(endsAt!))
    update(K.logs(d), D.logs, l => {
      l.items.push({ id: uid(), area, track, mins: dur, note: 'Focus session' })
    })
    const msg = `${dur} minutes of ${trackName(track)} logged. Take a 5 minute break.`
    onToast(msg)
    void notify('Focus session done', msg)
  } else {
    onToast('Break over. Back to it!')
    void notify('Break over', 'Back to it!')
  }
}
setInterval(() => {
  if (T.endsAt && Date.now() >= T.endsAt) finish()
  else if (T.endsAt) {
    T = { ...T } // new snapshot so the countdown re-renders
    listeners.forEach(l => l())
  }
}, 500)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && T.endsAt && !wake) void holdWake()
})
