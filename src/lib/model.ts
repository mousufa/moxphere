export type AreaId = 'health' | 'study' | 'social' | 'akhira' | 'selfcare' | 'hustles'

export const AREAS: { id: AreaId; name: string; sub: string }[] = [
  { id: 'health', name: 'Health', sub: 'Sleep, water, movement, mood and energy' },
  { id: 'study', name: 'Study', sub: 'Pharma core, career learning and tech' },
  { id: 'social', name: 'Social self', sub: 'Communication, people and confidence' },
  { id: 'akhira', name: 'Akhira', sub: 'Prayer, Quran, dhikr and distance from negativity' },
  { id: 'selfcare', name: 'Self care', sub: 'Trips, cooking, food hunts and making things' },
  { id: 'hustles', name: 'Side hustles', sub: 'Pinned, WhyPharm and the WhyPharm channel' },
]
export const areaName = (id: string) => AREAS.find(a => a.id === id)?.name ?? id

export interface Track {
  id: string
  area: AreaId
  name: string
  group?: string
  kind?: 'service' | 'product' | 'channel' | 'other'
}
export interface Habit { id: string; area: AreaId; name: string }

export interface Config {
  tracks: Track[]
  habits: Habit[]
  reminder: { on: boolean; time: string }
  exam: { name: string; date: string }
}

const t = (area: AreaId, id: string, name: string, extra: Partial<Track> = {}): Track => ({ id, area, name, ...extra })

export const DEFAULT_CONFIG: Config = {
  tracks: [
    t('study', 'drugs', 'Drug knowledge', { group: 'Pharma core' }),
    t('study', 'exam', 'University exam', { group: 'Pharma core' }),
    t('study', 'cdm', 'Clinical data management', { group: 'Career' }),
    t('study', 'cr', 'Clinical research', { group: 'Career' }),
    t('study', 'heor', 'HEOR', { group: 'Career' }),
    t('study', 'ra', 'Regulatory affairs', { group: 'Career' }),
    t('study', 'da', 'Data analysis', { group: 'Career' }),
    t('study', 'aipharma', 'AI roles in pharma', { group: 'Career' }),
    t('study', 'py', 'Python', { group: 'Tech' }),
    t('study', 'ai', 'AI', { group: 'Tech' }),
    t('study', 'ml', 'Machine learning', { group: 'Tech' }),
    t('social', 'comm', 'Communication'),
    t('social', 'artic', 'Articulation'),
    t('social', 'conn', 'Connections'),
    t('social', 'express', 'Expressing myself'),
    t('social', 'emo', 'Emotional control'),
    t('social', 'clarity', 'Clarity in conversation'),
    t('social', 'conf', 'Confidence'),
    t('selfcare', 'trip', 'Small trip'),
    t('selfcare', 'cook', 'Cooking'),
    t('selfcare', 'food', 'Food hunt'),
    t('selfcare', 'create', 'Creating something'),
    t('hustles', 'pinned', 'Pinned', { kind: 'service' }),
    t('hustles', 'whypharm', 'WhyPharm', { kind: 'product' }),
    t('hustles', 'yt', 'WhyPharm YouTube', { kind: 'channel' }),
    t('health', 'exercise', 'Exercise'),
  ],
  habits: [],
  reminder: { on: true, time: '19:00' },
  exam: { name: 'University exam', date: '' },
}
export const STUDY_GROUPS = ['Pharma core', 'Career', 'Tech']

/* ---------- documents ---------- */
export interface PlanItem { id: string; t: string; h?: number; done: boolean }
export interface LogItem { id: string; area: AreaId; track: string; mins: number; note: string }
export interface Drain { id: string; what: string; mins: number }
export type PrayerState = 'on' | 'late' | 'missed'
export const PRAYERS = [
  ['fajr', 'Fajr'], ['dhuhr', 'Dhuhr'], ['asr', 'Asr'], ['maghrib', 'Maghrib'], ['isha', 'Isha'],
] as const
export interface Health { sleep?: number; water?: number; move?: number; mood?: number; energy?: number }
export interface Akhira { p: Record<string, PrayerState>; quran?: number; dhikr?: boolean; jumuah?: boolean; noNeg?: boolean }

export interface Drug { id: string; name: string; cls: string; note: string; level: number; next: string; added: string }
export interface Subject { id: string; name: string; done: number; total: number }
export interface Milestone { id: string; track: string; t: string; done: boolean }
export interface Person { id: string; name: string; note: string; last: string }
export type TaskStatus = 'todo' | 'doing' | 'done'
export interface Task { id: string; t: string; status: TaskStatus }
export interface Money { id: string; date: string; amt: number; kind: 'in' | 'out'; note: string }
export const VIDEO_STAGES = ['Idea', 'Script', 'Record', 'Edit', 'Published'] as const
export interface Video { id: string; title: string; subject: string; stage: number }
export interface Hustle { tasks: Task[]; money: Money[]; videos: Video[]; note: string }
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
  exam: 'exam',
  milestones: 'milestones',
  people: 'people',
  hustle: (id: string) => `hustle/${id}`,
  me: 'me',
}

export const D = {
  plan: { items: [] as PlanItem[] },
  health: {} as Health,
  akhira: { p: {} } as Akhira,
  habits: {} as Record<string, boolean>,
  logs: { items: [] as LogItem[] },
  drains: { items: [] as Drain[] },
  journal: { text: '' },
  audit: { answers: {} as Record<string, string> },
  ratings: { r: {} as Record<string, number> },
  drugs: { items: [] as Drug[] },
  exam: { subjects: [] as Subject[] },
  milestones: { items: [] as Milestone[] },
  people: { items: [] as Person[] },
  hustle: { tasks: [], money: [], videos: [], note: '' } as Hustle,
  me: { who: [], values: [], notMine: [], noList: [], vision: {} } as Me,
}
