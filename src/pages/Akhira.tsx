import { useState } from 'react'
import { D, K, PRAYERS, type PrayerState } from '../lib/model'
import { isFriday, lastDays, nice, today, weekDays } from '../lib/date'
import { get, useDoc, useStore } from '../lib/store'
import { prayed, score, streak, sumDays } from '../lib/stats'
import { Check, DateNav, DayCols, Heat, PH, Sec, Seg, Stepper, Tiles } from '../ui/bits'
import { Habits } from '../ui/logs'

export default function Akhira() {
  useStore()
  const [date, setDate] = useState(today())
  const [a, setA] = useDoc(K.akhira(date), D.akhira)
  const t = today()
  const week = weekDays(t).filter(d => d <= t)
  const month = lastDays(30)
  const fridays = month.filter(isFriday)
  const ak = (d: string) => get(K.akhira(d), D.akhira)
  return (
    <div className="stack">
      <PH title="Akhira" sub="Prayer on time, Quran, dhikr, Jumu'ah and distance from negativity" />
      <Tiles four items={[
        { label: 'On time this week', value: `${sumDays(week, d => prayed(d).onTime)}/${week.length * 5}` },
        { label: 'Quran, 30 days', value: sumDays(month, d => ak(d).quran || 0), sub: 'pages' },
        { label: "Jumu'ah, 30 days", value: `${fridays.filter(d => ak(d).jumuah).length}/${fridays.length}` },
        { label: 'Streak', value: `${streak('akhira')}d` },
      ]} />
      <div className="cols">
        <div className="stack">
          <DateNav date={date} setDate={setDate} />
          <Sec title="Salah">
            <ul className="list">
              {PRAYERS.map(([k, name]) => (
                <li key={k} style={{ alignItems: 'center' }}>
                  <span style={{ padding: '10px 0' }}>{name}</span>
                  <Seg<PrayerState> label={name} value={a.p?.[k]} options={[{ v: 'on', t: 'On time' }, { v: 'late', t: 'Late' }, { v: 'missed', t: 'Missed' }]}
                    onChange={v => setA(x => { x.p = x.p || {}; if (v) x.p[k] = v; else delete x.p[k] })} />
                </li>
              ))}
            </ul>
          </Sec>
          <Sec title="Today's deeds">
            <div className="row between"><span>Quran (pages)</span><Stepper label="Quran pages" value={a.quran} max={604} onChange={v => setA(x => { x.quran = v })} /></div>
            <Check checked={!!a.dhikr} onChange={c => setA(x => { x.dhikr = c })}>Dhikr</Check>
            {isFriday(date) && <Check checked={!!a.jumuah} onChange={c => setA(x => { x.jumuah = c })}>Attended Jumu'ah</Check>}
            <Check checked={!!a.noNeg} onChange={c => setA(x => { x.noNeg = c })}>Stayed away from negativity</Check>
          </Sec>
          <Sec title="More daily goals"><Habits area="akhira" date={date} /></Sec>
        </div>
        <div className="stack">
          <Sec title="Prayers on time" sub="Last 14 days, out of 5"><DayCols value={d => prayed(d).onTime} fmt={v => `${v} of 5`} max={5} /></Sec>
          <Sec title="Quran" sub="Pages, last 14 days"><DayCols value={d => ak(d).quran} fmt={v => `${v} pages`} /></Sec>
          <Sec title="Consistency"><Heat value={d => score('akhira', d)} label={(d, v) => `${nice(d)} · ${v} deeds`} /></Sec>
        </div>
      </div>
    </div>
  )
}
