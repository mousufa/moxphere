/* ---------- the map: branches and their leaves ---------- */
export type BranchId = 'learning' | 'project' | 'building' | 'research' | 'career' | 'akhira' | 'self' | 'joy' | 'health' | 'control'
export type Kind =
  | 'learn' | 'project' | 'service' | 'product' | 'channel' | 'tutoring' | 'pipeline' | 'career'
  | 'prayer' | 'quran' | 'daily' | 'skill' | 'activity' | 'people' | 'health' | 'link'

export interface Leaf {
  id: string
  name: string
  kind: Kind
  sub?: string
  group?: string
  href?: string
  stages?: string[]
  prompt?: string
  count?: string
  drugs?: boolean
}
export interface Branch { id: BranchId; name: string; sub: string; leaves: Leaf[]; addKind?: Kind; addLabel?: string }

const L = (id: string, name: string, kind: Kind, extra: Partial<Leaf> = {}): Leaf => ({ id, name, kind, ...extra })

export const BRANCHES: Branch[] = [
  {
    id: 'learning', name: 'Learning', sub: 'University subjects, JRF and tech', addKind: 'learn', addLabel: 'Add a subject or skill',
    leaves: [
      L('ptx', 'Pharmacotherapeutics', 'learn', { group: 'University', drugs: true }),
      L('cpk', 'Clinical pharmacokinetics & TDM', 'learn', { group: 'University' }),
      L('peq', 'Pharmacoeconomics & QUM', 'learn', { group: 'University' }),
      L('jrf', 'JRF exam', 'learn', { group: 'Exams' }),
      L('py', 'Python', 'learn', { group: 'Tech' }),
      L('ai', 'AI', 'learn', { group: 'Tech' }),
      L('ml', 'Machine learning', 'learn', { group: 'Tech' }),
    ],
  },
  {
    id: 'project', name: 'Academic project', sub: 'Inventory demand forecasting', addKind: 'project', addLabel: 'Add a project',
    leaves: [L('forecast', 'Demand forecasting model', 'project', { sub: 'Forecasting inventory demand' })],
  },
  {
    id: 'building', name: 'Building', sub: 'Side hustles and freelancing', addKind: 'service', addLabel: 'Add a hustle',
    leaves: [
      L('pinned', 'Pinned', 'service', { sub: 'Service business' }),
      L('whypharm', 'WhyPharm', 'product', { sub: 'Product business' }),
      L('yt', 'WhyPharm on YouTube', 'channel', { sub: 'Pharma content' }),
      L('tutoring', 'Tutoring', 'tutoring', { sub: 'Freelance teaching' }),
    ],
  },
  {
    id: 'research', name: 'Research & publication', sub: 'Papers, presentations, reviews', addKind: 'pipeline', addLabel: 'Add a research area',
    leaves: [
      L('pub', 'Publishing my work', 'pipeline', { stages: ['Idea', 'Data', 'Writing', 'Submitted', 'Published'] }),
      L('oral', 'Oral presentations', 'pipeline', { stages: ['Idea', 'Abstract sent', 'Accepted', 'Slides ready', 'Presented'] }),
      L('review', 'Review articles', 'pipeline', { stages: ['Topic', 'Literature search', 'Writing', 'Submitted', 'Published'] }),
      L('meta', 'Meta-analysis', 'pipeline', { stages: ['Protocol', 'Search', 'Screening', 'Analysis', 'Writing', 'Submitted', 'Published'] }),
    ],
  },
  {
    id: 'career', name: 'Career pathway', sub: 'Non-clinical pharma roles', addKind: 'career', addLabel: 'Add a role or path',
    leaves: [
      L('map', 'My career map', 'career', { sub: 'Your overall plan, in your words' }),
      L('cdm', 'Clinical data management', 'career'),
      L('heor', 'HEOR', 'career'),
      L('ra', 'Regulatory affairs', 'career'),
      L('cr', 'Clinical research', 'career'),
    ],
  },
  {
    id: 'akhira', name: 'Akhira', sub: 'Spiritual goals', addKind: 'daily', addLabel: 'Add a daily deed',
    leaves: [
      L('prayer', 'Prayer on time', 'prayer'),
      L('quran', 'Quran', 'quran'),
      L('dhikr', 'Dhikr', 'daily', { prompt: 'Did dhikr today', count: 'Count' }),
      L('dua', 'Dua', 'daily', { prompt: 'Made dua today' }),
      L('istighfar', 'Istighfar', 'daily', { prompt: 'Did istighfar today', count: 'Count' }),
      L('nafs', 'Controlling nafs', 'daily', { prompt: "Held back from what I shouldn't do", sub: 'Self-control and staying away from negativity' }),
    ],
  },
  {
    id: 'self', name: 'Self improvement', sub: 'How you speak, write and carry yourself', addKind: 'skill', addLabel: 'Add a skill',
    leaves: [
      L('comm', 'Communication', 'skill'),
      L('conf', 'Confidence', 'skill'),
      L('artic', 'Articulation', 'skill'),
      L('clarity', 'Clarity', 'skill'),
      L('writing', 'Writing', 'skill'),
    ],
  },
  {
    id: 'joy', name: 'Things I love', sub: 'What fills you up', addKind: 'activity', addLabel: 'Add something you love',
    leaves: [
      L('people', 'Talking to good people', 'people'),
      L('food', 'Food hunts', 'activity'),
      L('travel', 'Travel', 'activity'),
      L('cook', 'Cooking', 'activity'),
      L('feelgood', 'Feel-good watching', 'activity'),
      L('solo', 'Solo adventures', 'activity', { sub: 'Plan them, then go' }),
    ],
  },
  {
    id: 'health', name: 'Health', sub: 'Sleep, water, movement, mood', addKind: 'activity', addLabel: 'Add something to track',
    leaves: [L('checkin', 'Daily check-in', 'health'), L('exercise', 'Exercise', 'activity')],
  },
  {
    id: 'control', name: 'Audit & self-control', sub: 'Plan, focus, reflect',
    leaves: [
      L('today', "Today's plan", 'link', { href: '#today' }),
      L('focus', 'Focus timer', 'link', { href: '#focus' }),
      L('drains', 'Zero-return time', 'link', { href: '#drains' }),
      L('journal', 'Journal', 'link', { href: '#journal' }),
      L('me', 'Me, by me', 'link', { href: '#me' }),
      L('audit', 'Weekly audit', 'link', { href: '#audit' }),
    ],
  },
]
/** Branches that count toward your weekly balance. */
export const LIFE = BRANCHES.filter(b => b.id !== 'control')
export const LOGGABLE: Kind[] = ['learn', 'project', 'service', 'product', 'channel', 'tutoring', 'pipeline', 'career', 'skill', 'activity', 'people']

export interface Habit { id: string; area: string; name: string }
export interface Config {
  extraLeaves: { branch: BranchId; leaf: Leaf }[]
  habits: Habit[]
  reminder: { on: boolean; time: string }
}
export const DEFAULT_CONFIG: Config = { extraLeaves: [], habits: [], reminder: { on: true, time: '19:00' } }

/* ---------- documents ---------- */
export interface PlanItem { id: string; t: string; h?: number; done: boolean }
export interface LogItem { id: string; area: string; track: string; mins: number; note: string; who?: string }
export interface Drain { id: string; what: string; mins: number }
export type PrayerState = 'on' | 'late' | 'missed'
export const PRAYERS = [
  ['fajr', 'Fajr'], ['dhuhr', 'Dhuhr'], ['asr', 'Asr'], ['maghrib', 'Maghrib'], ['isha', 'Isha'],
] as const
export interface Health { sleep?: number; water?: number; move?: number; mood?: number; energy?: number }
export interface Akhira {
  p: Record<string, PrayerState>
  quran?: number
  dhikr?: boolean
  jumuah?: boolean
  noNeg?: boolean
  checks?: Record<string, boolean>
  counts?: Record<string, number>
  notes?: Record<string, string>
}

export interface Drug { id: string; name: string; cls: string; note: string; level: number; next: string; added: string }
export interface Person { id: string; name: string; note: string; last: string }
export type TaskStatus = 'todo' | 'doing' | 'done'
export interface Task { id: string; t: string; status: TaskStatus }
export interface Money { id: string; date: string; amt: number; kind: 'in' | 'out'; note: string }
export const VIDEO_STAGES = ['Idea', 'Script', 'Record', 'Edit', 'Published']
export interface Item { id: string; title: string; subject: string; stage: number }
export interface Update { id: string; date: string; text: string }
export interface Check { id: string; t: string; done: boolean }
export interface Student { id: string; name: string; note: string; active: boolean }
export interface LeafDoc {
  note: string
  tasks: Task[]
  money: Money[]
  videos: Item[]
  items: Item[]
  topics: Check[]
  steps: Check[]
  links: string[]
  wish: string[]
  updates: Update[]
  students: Student[]
  examDate: string
  goal?: number
}
export interface Me { who: string[]; values: string[]; notMine: string[]; noList: string[]; vision: Record<string, string> }

export const K = {
  config: 'config',
  plan: (d: string) => `d/${d}/plan`,
  health: (d: string) => `d/${d}/health`,
  akhira: (d: string) => `d/${d}/akhira`,
  habits: (d: string) => `d/${d}/habits`,
  logs: (d: string) => `d/${d}/logs`,
  drains: (d: string) => `d/${d}/drains`,
  journal: (d: string) => `d/${d}/journal`,
  audit: (w: string) => `w/${w}/audit`,
  ratings: (w: string) => `w/${w}/social`,
  drugs: 'drugs',
  people: 'people',
  /** The first three hustles kept their original storage keys. */
  leaf: (id: string) => (['pinned', 'whypharm', 'yt'].includes(id) ? `hustle/${id}` : `leaf/${id}`),
  me: 'me',
}

export const D = {
  plan: { items: [] as PlanItem[] },
  health: {} as Health,
  akhira: { p: {} } as Akhira,
  habits: {} as Record<string, boolean>,
  logs: { items: [] as LogItem[] },
  drains: { items: [] as Drain[] },
  journal: { text: '', wins: [] as string[] },
  audit: { answers: {} as Record<string, string> },
  ratings: { r: {} as Record<string, number> },
  drugs: { items: [] as Drug[] },
  people: { items: [] as Person[] },
  leaf: { note: '', tasks: [], money: [], videos: [], items: [], topics: [], steps: [], links: [], wish: [], updates: [], students: [], examDate: '' } as LeafDoc,
  me: { who: [], values: [], notMine: [], noList: [], vision: {} } as Me,
}
