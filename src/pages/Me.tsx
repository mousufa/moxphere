import { D, K, LIFE } from '../lib/model'
import { useDoc } from '../lib/store'
import { ListEditor, PH, Sec } from '../ui/bits'

export default function Me() {
  const [me, setMe] = useDoc(K.me, D.me)
  return (
    <div className="stack">
      <PH title="Me, by me" sub="Your own definition. Nobody else's labels live here." />
      <div className="cols even">
        <div className="stack">
          <Sec title="Who I am" sub="In my own words">
            <ListEditor items={me.who} onChange={v => setMe(m => { m.who = v })} placeholder="I am someone who keeps learning" label="Add a statement" />
          </Sec>
          <Sec title="What I value">
            <ListEditor items={me.values} onChange={v => setMe(m => { m.values = v })} placeholder="Honesty" label="Add a value" />
          </Sec>
          <Sec title="Labels I don't accept" sub="Things people said or implied about me that are not true. Write the label, then why it's wrong.">
            <ListEditor items={me.notMine} onChange={v => setMe(m => { m.notMine = v })} placeholder="'Too quiet': I speak when I have something worth saying" label="Add a label you reject" />
          </Sec>
          <Sec title="What I'm cutting" sub="Zero-return habits, places and conversations">
            <ListEditor items={me.noList} onChange={v => setMe(m => { m.noList = v })} placeholder="Scrolling after 11 PM" label="Add something to cut" />
          </Sec>
        </div>
        <div className="stack">
          <Sec title="My full-potential version" sub="What the best version of you looks like in each part of life">
            {LIFE.map(a => (
              <label key={a.id} className="field">
                <span className="label">{a.name}</span>
                <textarea value={me.vision[a.id] || ''} style={{ minHeight: 80 }}
                  placeholder={PH_TEXT[a.id]}
                  onChange={e => { const v = e.target.value; setMe(m => { m.vision = { ...m.vision, [a.id]: v } }) }} />
              </label>
            ))}
          </Sec>
        </div>
      </div>
    </div>
  )
}

const PH_TEXT: Record<string, string> = {
  learning: 'Top marks in my subjects, JRF cleared, comfortable with Python and ML',
  project: 'A forecasting model I can explain and defend, written up well',
  building: 'Pinned has steady clients, WhyPharm sells, the channel helps students, tutoring pays well',
  research: 'Published papers, confident oral presentations, a meta-analysis to my name',
  career: 'Working in HEOR, CDM, regulatory or clinical research, in a role I chose',
  akhira: 'Every prayer on time, Quran daily, dhikr and istighfar, in control of my nafs',
  self: 'Speaks and writes clearly, calm and confident in any room',
  joy: 'Good people around me, regular trips and food hunts, solo adventures',
  health: 'Sleeping 7 hours, moving every day, steady energy',
}
