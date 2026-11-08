/**
 * Local-first document store. Every piece of data is a small JSON document under a key
 * (for example `d/2026-11-08/health`). Documents live in IndexedDB on this device and
 * are synced to Supabase when sync is set up. Conflicts resolve per document: the most
 * recent edit wins.
 */
import { createStore, entries, setMany } from 'idb-keyval'
import { useSyncExternalStore } from 'react'

export interface Rec { data: unknown; at: number }

const idb = createStore('moxphere', 'docs')
const mem = new Map<string, Rec>()
let dirty = new Set<string>()
let version = 0
const listeners = new Set<() => void>()
const dirtyListeners = new Set<() => void>()

function emit() {
  version++
  listeners.forEach(l => l())
}

/* ---------- persistence ---------- */
const queue = new Map<string, Rec>()
let persistTimer: ReturnType<typeof setTimeout> | undefined
function persist(key: string) {
  const rec = mem.get(key)
  if (rec) queue.set(key, rec)
  clearTimeout(persistTimer)
  persistTimer = setTimeout(flushPersist, 150)
}
export async function flushPersist() {
  clearTimeout(persistTimer)
  const items: [string, unknown][] = [...queue]
  queue.clear()
  items.push(['__dirty', [...dirty]])
  try {
    await setMany(items, idb)
  } catch (e) {
    console.error('Could not save to this device', e)
  }
}

export async function loadStore() {
  try {
    for (const [k, v] of await entries<string, any>(idb)) {
      if (k === '__dirty') dirty = new Set(v as string[])
      else mem.set(k, v as Rec)
    }
  } catch (e) {
    console.error('Could not read saved data', e)
  }
  emit()
}

/* ---------- reads ---------- */
export function get<T>(key: string, def: T): T {
  const rec = mem.get(key)
  if (!rec) return def
  if (def && typeof def === 'object' && !Array.isArray(def)) return { ...def, ...(rec.data as object) } as T
  return rec.data as T
}
export function has(key: string) {
  return mem.has(key)
}
export function keys(prefix = '') {
  return [...mem.keys()].filter(k => k.startsWith(prefix))
}

/* ---------- writes ---------- */
export function put(key: string, data: unknown) {
  const prev = mem.get(key)?.at ?? 0
  mem.set(key, { data, at: Math.max(Date.now(), prev + 1) })
  dirty.add(key)
  persist(key)
  emit()
  dirtyListeners.forEach(l => l())
}
export function update<T>(key: string, def: T, fn: (draft: T) => void) {
  const draft = structuredClone(get(key, def))
  fn(draft)
  put(key, draft)
}

/* ---------- sync hooks ---------- */
export function applyRemote(rows: { key: string; data: unknown; updated_at: number }[]) {
  let changed = false
  for (const r of rows) {
    const local = mem.get(r.key)
    const at = Number(r.updated_at)
    if (!local || at > local.at) {
      mem.set(r.key, { data: r.data, at })
      dirty.delete(r.key)
      persist(r.key)
      changed = true
    }
  }
  if (changed) emit()
}
export function dirtyDocs() {
  return [...dirty].filter(k => mem.has(k)).map(k => ({ key: k, data: mem.get(k)!.data, updated_at: mem.get(k)!.at }))
}
export function markClean(key: string, at: number) {
  if (mem.get(key)?.at === at) dirty.delete(key)
  persist(key)
}
export const pendingCount = () => dirty.size
export function onDirty(fn: () => void) {
  dirtyListeners.add(fn)
  return () => dirtyListeners.delete(fn)
}

/* ---------- backup ---------- */
export function dumpAll() {
  return Object.fromEntries([...mem].map(([k, v]) => [k, v.data]))
}
export function importDocs(docs: Record<string, unknown>) {
  for (const [k, v] of Object.entries(docs)) put(k, v)
}

/* ---------- react ---------- */
function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
/** Re-renders the component on any data change. */
export function useStore() {
  return useSyncExternalStore(subscribe, () => version)
}
export function useDoc<T>(key: string, def: T): [T, (fn: (d: T) => void) => void] {
  useStore()
  return [get(key, def), (fn: (d: T) => void) => update(key, def, fn)]
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => void flushPersist())
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void flushPersist()
  })
}
