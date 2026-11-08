import type { SupabaseClient, Session, RealtimeChannel } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { applyRemote, dirtyDocs, markClean, onDirty } from './store'

export type SyncStatus = 'local' | 'signedout' | 'syncing' | 'synced' | 'offline' | 'error'
interface State { status: SyncStatus; email?: string; message?: string; lastSync?: number }

let state: State = { status: 'local' }
const listeners = new Set<() => void>()
const setState = (s: Partial<State>) => {
  state = { ...state, ...s }
  listeners.forEach(l => l())
}
export const useSync = () =>
  useSyncExternalStore(
    l => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    () => state,
  )

const CFG = 'moxphere:supabase'
export function syncConfig(): { url: string; key: string; fromEnv: boolean } | null {
  try {
    const saved = JSON.parse(localStorage.getItem(CFG) || 'null')
    if (saved?.url && saved?.key) return { ...saved, fromEnv: false }
  } catch {}
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  return url && key ? { url, key, fromEnv: true } : null
}
export function saveSyncConfig(url: string, key: string) {
  localStorage.setItem(CFG, JSON.stringify({ url: url.trim(), key: key.trim() }))
  location.reload()
}
export function clearSyncConfig() {
  localStorage.removeItem(CFG)
  location.reload()
}

let client: SupabaseClient | null = null
let uid: string | null = null
let channel: RealtimeChannel | null = null
let loop: ReturnType<typeof setInterval> | undefined
let pushTimer: ReturnType<typeof setTimeout> | undefined
let running = false
let again = false

export async function initSync() {
  const cfg = syncConfig()
  if (!cfg) return setState({ status: 'local' })
  try {
    const { createClient } = await import('@supabase/supabase-js')
    client = createClient(cfg.url, cfg.key, { auth: { persistSession: true, autoRefreshToken: true } })
  } catch (e) {
    return setState({ status: 'error', message: 'The sync address or key looks wrong. Check them in Settings.' })
  }
  const { data } = await client.auth.getSession()
  onSession(data.session)
  client.auth.onAuthStateChange((_e, s) => onSession(s))
  onDirty(() => {
    clearTimeout(pushTimer)
    pushTimer = setTimeout(syncNow, 1500)
  })
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void syncNow()
    else if (dirtyDocs().length) void syncNow()
  })
  window.addEventListener('online', () => void syncNow())
}

function onSession(s: Session | null) {
  const next = s?.user?.id ?? null
  if (next === uid) return
  uid = next
  stopLoop()
  if (!uid) return setState({ status: 'signedout', email: undefined })
  setState({ status: 'syncing', email: s!.user.email })
  void syncNow()
  loop = setInterval(syncNow, 60000)
  channel = client!
    .channel('docs-' + uid)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'docs', filter: `user_id=eq.${uid}` }, p => {
      const r = p.new as { key?: string; data?: unknown; updated_at?: number }
      if (r?.key) applyRemote([{ key: r.key, data: r.data, updated_at: Number(r.updated_at) }])
    })
    .subscribe()
}
function stopLoop() {
  clearInterval(loop)
  if (channel && client) void client.removeChannel(channel)
  channel = null
}

export async function syncNow() {
  if (!client || !uid) return
  if (running) {
    again = true
    return
  }
  running = true
  setState({ status: 'syncing' })
  try {
    await pull()
    await push()
    setState({ status: 'synced', lastSync: Date.now(), message: undefined })
  } catch (e: any) {
    setState(
      navigator.onLine
        ? { status: 'error', message: e?.message || 'Sync failed. It will try again in a minute.' }
        : { status: 'offline', message: undefined },
    )
  } finally {
    running = false
    if (again) {
      again = false
      void syncNow()
    }
  }
}

async function pull() {
  const ck = 'moxphere:cursor:' + uid
  const cursor = localStorage.getItem(ck)
  // Re-read a two-minute overlap so writes that committed late are not skipped.
  let since = cursor ? new Date(Date.parse(cursor) - 120000).toISOString() : '1970-01-01T00:00:00Z'
  let newest = cursor
  for (;;) {
    const { data, error } = await client!
      .from('docs')
      .select('key,data,updated_at,server_at')
      .gt('server_at', since)
      .order('server_at', { ascending: true })
      .limit(1000)
    if (error) throw error
    if (!data?.length) break
    applyRemote(data as any)
    since = data[data.length - 1].server_at
    if (!newest || since > newest) newest = since
    if (data.length < 1000) break
  }
  if (newest) localStorage.setItem(ck, newest)
}

async function push() {
  const docs = dirtyDocs()
  for (let i = 0; i < docs.length; i += 200) {
    const batch = docs.slice(i, i + 200)
    const { data, error } = await client!.rpc('put_docs', { docs: batch })
    if (error) throw error
    batch.forEach(d => markClean(d.key, d.updated_at))
    if (Array.isArray(data) && data.length) applyRemote(data as any)
  }
}

export async function signIn(email: string, password: string) {
  if (!client) throw new Error('Set up sync first.')
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
}
export async function signUp(email: string, password: string) {
  if (!client) throw new Error('Set up sync first.')
  const { data, error } = await client.auth.signUp({ email, password })
  if (error) throw error
  return !data.session // true when the account needs email confirmation
}
export async function signOut() {
  await client?.auth.signOut()
}
