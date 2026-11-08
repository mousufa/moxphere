import { AREAS } from '../lib/model'
import { today } from '../lib/date'
import { useStore } from '../lib/store'
import { balance } from '../lib/stats'
import { PH } from '../ui/bits'

export default function Areas() {
  useStore()
  const bal = balance(today())
  return (
    <div className="stack">
      <PH title="Areas" sub="Every part of your life, and how this week is going" />
      <nav className="areas" aria-label="Areas">
        {AREAS.map(a => {
          const b = bal.find(x => x.id === a.id)!
          return (
            <a key={a.id} className="area-link" href={'#' + a.id}>
              <span><b>{a.name}</b><small>{a.sub}</small></span>
              <span className="val">{b.active}/{b.days} days</span>
            </a>
          )
        })}
        <a className="area-link" href="#me"><span><b>Me, by me</b><small>Who you are, in your words</small></span><span /></a>
        <a className="area-link" href="#settings"><span><b>Settings</b><small>Sync, backup and install</small></span><span /></a>
      </nav>
    </div>
  )
}
