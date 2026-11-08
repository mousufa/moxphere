import { useState } from 'react'
import { D, DEFAULT_CONFIG, K, type PlanItem } from '../lib/model'
import { today, uid } from '../lib/date'
import { dumpAll, importDocs, get, pendingCount, update, useDoc, useStore } from '../lib/store'
import { clearSyncConfig, saveSyncConfig, signIn, signOut, signUp, syncConfig, syncNow, useSync } from '../lib/sync'
import { PH, Sec, toast } from '../ui/bits'

export default function Settings() {
  useStore()
  return (
    <div className="stack">
      <PH title="Settings" />
      <div className="cols even">
        <SyncBox />
        <div className="stack">
          <Reminder />
          <Backup />
          <Sec title="Install on your phone">
            <p>Android (Chrome): open Moxphere, tap the ⋮ menu, then <b>Add to Home screen</b> or <b>Install app</b>.</p>
            <p>iPhone (Safari): tap Share, then <b>Add to Home Screen</b>.</p>
            <p>Laptop (Chrome or Edge): click the install icon at the right end of the address bar.</p>
            <p className="small mute">Moxphere works offline. Everything you add is saved on the device first and synced when you're online.</p>
          </Sec>
        </div>
      </div>
    </div>
  )
}

function SyncBox() {
  const s = useSync()
  const cfg = syncConfig()
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const act = async (f: () => Promise<unknown>, ok?: string) => {
    setBusy(true)
    setMsg('')
    try {
      const r = await f()
      if (r === true) setMsg('Check your email and open the confirmation link, then sign in here.')
      else if (ok) toast(ok)
    } catch (e: any) {
      setMsg(e?.message || 'That did not work. Try again.')
    } finally {
      setBusy(false)
    }
  }
  const STATUS: Record<string, string> = {
    local: 'Sync is not set up. Your data is only on this device.',
    signedout: 'Sync is set up. Sign in to sync this device.',
    syncing: 'Syncing…',
    synced: `Synced${s.lastSync ? ' at ' + new Date(s.lastSync).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : ''}.`,
    offline: 'Offline. Changes are kept here and will sync when you are back online.',
    error: s.message || 'Sync had a problem. It will try again.',
  }
  return (
    <Sec title="Sync between laptop and phone">
      <p>{STATUS[s.status]}{s.email ? ` Signed in as ${s.email}.` : ''}</p>
      {pendingCount() > 0 && s.status !== 'local' && <p className="small dim">{pendingCount()} changes waiting to sync.</p>}

      {!cfg && (
        <form className="sec" onSubmit={e => { e.preventDefault(); if (url && key) saveSyncConfig(url, key) }}>
          <p className="small dim">Paste the Project URL and anon public key from your Supabase project (Project Settings, API). The README explains the setup.</p>
          <label className="field"><span className="label">Project URL</span><input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://abcd.supabase.co" required /></label>
          <label className="field"><span className="label">Anon public key</span><input type="text" value={key} onChange={e => setKey(e.target.value)} required /></label>
          <div><button className="btn primary">Turn on sync</button></div>
        </form>
      )}

      {cfg && s.status === 'signedout' && (
        <form className="sec" onSubmit={e => { e.preventDefault(); void act(() => signIn(email, pw), 'Signed in. Syncing now.') }}>
          <label className="field"><span className="label">Email</span><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
          <label className="field"><span className="label">Password</span><input type="password" autoComplete="current-password" minLength={6} value={pw} onChange={e => setPw(e.target.value)} required /></label>
          <div className="row">
            <button className="btn primary" disabled={busy}>Sign in</button>
            <button type="button" className="btn" disabled={busy || !email || pw.length < 6} onClick={() => void act(() => signUp(email, pw), 'Account created. Syncing now.')}>Create account</button>
          </div>
        </form>
      )}

      {cfg && s.email && (
        <div className="row">
          <button className="btn" onClick={() => void syncNow()}>Sync now</button>
          <button className="btn" onClick={() => void act(signOut, 'Signed out. Your data stays on this device.')}>Sign out</button>
        </div>
      )}
      {msg && <p role="alert">{msg}</p>}
      {cfg && !cfg.fromEnv && <button className="link" style={{ justifySelf: 'start' }} onClick={clearSyncConfig}>Change sync project</button>}
    </Sec>
  )
}

function Reminder() {
  const [cfg, setCfg] = useDoc(K.config, DEFAULT_CONFIG)
  const r = { ...DEFAULT_CONFIG.reminder, ...cfg.reminder }
  return (
    <Sec title="Study reminder" sub="Shows on Home if you haven't logged any learning by this time">
      <div className="row">
        <label className="row" style={{ gap: 8 }}>
          <input type="checkbox" checked={r.on} style={{ accentColor: 'var(--accent)', width: 18, height: 18 }} onChange={e => setCfg(c => { c.reminder = { ...r, on: e.target.checked } })} />
          Remind me at
        </label>
        <input type="time" value={r.time} style={{ width: 'auto' }} aria-label="Reminder time" onChange={e => setCfg(c => { c.reminder = { ...r, time: e.target.value || '19:00' } })} />
      </div>
    </Sec>
  )
}

function Backup() {
  const download = () => {
    const blob = new Blob([JSON.stringify({ app: 'moxphere', version: 1, exported: new Date().toISOString(), docs: dumpAll() }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `moxphere-backup-${today()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }
  const load = async (f: File) => {
    try {
      const json = JSON.parse(await f.text())
      if (json?.app === 'moxphere' && json.docs) {
        importDocs(json.docs)
        toast(`Restored ${Object.keys(json.docs).length} records.`)
      } else if (json?.days) {
        toast(`Imported ${importOld(json.days)} days from the first Moxphere.`)
      } else throw new Error()
    } catch {
      toast("That file isn't a Moxphere backup.")
    }
  }
  return (
    <Sec title="Backup">
      <p>Download everything as one file now and then. You can restore it here, and it also brings in a backup from the first Moxphere page.</p>
      <div className="row">
        <button className="btn primary" onClick={download}>Download a backup</button>
        <label className="btn" style={{ cursor: 'pointer' }}>
          Restore from a file
          <input type="file" accept="application/json,.json" hidden onChange={e => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = '' }} />
        </label>
      </div>
    </Sec>
  )
}

const OLD_NAMES: Record<string, string> = {
  skills: 'Skills', hustle: 'Side hustles', study: 'Study', project: 'Project', research: 'Research', social: 'Content', akhira: 'Akhira', today: 'Plan',
}
/** Brings in data from the first single-page Moxphere: plans, diary and notes. */
function importOld(days: Record<string, Record<string, { items?: { id: string; t: string; done: boolean; h?: number }[]; note?: string }>>) {
  let n = 0
  for (const [date, secs] of Object.entries(days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    n++
    const plan: PlanItem[] = []
    const notes: string[] = []
    for (const [sec, s] of Object.entries(secs || {})) {
      for (const it of s.items || []) plan.push({ id: uid(), t: sec === 'today' ? it.t : `${OLD_NAMES[sec] ?? sec}: ${it.t}`, done: !!it.done, ...(typeof it.h === 'number' ? { h: it.h } : {}) })
      if (s.note?.trim()) notes.push(sec === 'diary' ? s.note.trim() : `${OLD_NAMES[sec] ?? sec}\n${s.note.trim()}`)
    }
    if (plan.length) update(K.plan(date), D.plan, p => { p.items.push(...plan) })
    if (notes.length) {
      const cur = get(K.journal(date), { text: '' }).text
      update(K.journal(date), { text: '', wins: [] as string[] }, j => { j.text = [cur, ...notes].filter(Boolean).join('\n\n') })
    }
  }
  return n
}
