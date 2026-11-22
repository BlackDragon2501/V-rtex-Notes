// Vórtex Notes - modelo de datos y almacenamiento local (localStorage).
// Tres modulos: Notas, Diario (journaling) y Enlaces rapidos.
// 100% local: nada sale del navegador.

export interface Note {
  id: string
  title: string
  content: string // markdown
  tags: string[]
  pinned: boolean
  createdAt: number
  updatedAt: number
}

export interface JournalEntry {
  date: string // 'YYYY-MM-DD'
  content: string
  mood: number // 0 sin estado, 1 muy mal .. 5 genial
  updatedAt: number
}

export interface LinkItem {
  id: string
  title: string
  url: string
  category: string
  color: string // indice en LINK_COLORS
  createdAt: number
}

export interface NotesBundle {
  notes: Note[]
  journal: Record<string, JournalEntry>
  links: LinkItem[]
}

export const MOODS = [
  { value: 1, label: 'Muy mal', color: '#ef4444' },
  { value: 2, label: 'Mal', color: '#f97316' },
  { value: 3, label: 'Normal', color: '#eab308' },
  { value: 4, label: 'Bien', color: '#22c55e' },
  { value: 5, label: 'Genial', color: '#0ea5e9' },
]

export const LINK_COLORS = [
  { name: 'Cian', value: '#0ea5e9' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Violeta', value: '#8b5cf6' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Ambar', value: '#f59e0b' },
  { name: 'Rojo', value: '#ef4444' },
  { name: 'Turquesa', value: '#14b8a6' },
  { name: 'Gris', value: '#6b7280' },
]

export const TAG_PALETTE = [
  '#0ea5e9', '#10b981', '#8b5cf6', '#ec4899',
  '#f59e0b', '#ef4444', '#14b8a6', '#a3e635',
]

export function tagColor(tag: string): string {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0
  return TAG_PALETTE[h % TAG_PALETTE.length]
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

// ---------- persistencia ----------

const KEYS = {
  notes: 'vortex-notes-v1',
  journal: 'vortex-journal-v1',
  links: 'vortex-links-v1',
}

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeLS(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // almacenamiento lleno o no disponible: se ignora silenciosamente
  }
}

export function loadNotes(): Note[] {
  return readLS<Note[]>(KEYS.notes, [])
}

export function saveNotes(notes: Note[]) {
  writeLS(KEYS.notes, notes)
}

export function loadJournal(): Record<string, JournalEntry> {
  return readLS<Record<string, JournalEntry>>(KEYS.journal, {})
}

export function saveJournal(entries: Record<string, JournalEntry>) {
  writeLS(KEYS.journal, entries)
}

export function loadLinks(): LinkItem[] {
  return readLS<LinkItem[]>(KEYS.links, [])
}

export function saveLinks(links: LinkItem[]) {
  writeLS(KEYS.links, links)
}

// ---------- utilidades de fechas ----------

export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function monthLabel(year: number, month: number): string {
  return `${MONTHS_ES[month]} ${year}`
}

export function longDateEs(key: string): string {
  const d = parseDateKey(key)
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  return `${dias[d.getDay()]}, ${d.getDate()} de ${MONTHS_ES[d.getMonth()]} de ${d.getFullYear()}`
}

// Matriz del calendario: semanas x dias (lunes primero). null = dia de otro mes.
export function calendarMatrix(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7 // lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(todayKey(new Date(year, month, d)))
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

// Rachas de escritura: dias consecutivos con entrada (incluye hoy si escribio hoy).
export function journalStreak(entries: Record<string, JournalEntry>): number {
  const written = new Set(
    Object.keys(entries).filter((k) => (entries[k]?.content || '').trim().length > 0)
  )
  let streak = 0
  const cursor = new Date()
  if (!written.has(todayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1) // la racha puede seguir viva desde ayer
  }
  while (written.has(todayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// ---------- export / import ----------

export function exportBundle(notes: Note[], journal: Record<string, JournalEntry>, links: LinkItem[]) {
  const bundle: NotesBundle = { notes, journal, links }
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'vortex-notes.json'
  a.click()
  URL.revokeObjectURL(a.href)
}

export function parseBundle(json: string): NotesBundle | null {
  try {
    const data = JSON.parse(json) as Partial<NotesBundle>
    if (!data || typeof data !== 'object') return null
    return {
      notes: Array.isArray(data.notes) ? data.notes : [],
      journal: data.journal && typeof data.journal === 'object' ? data.journal : {},
      links: Array.isArray(data.links) ? data.links : [],
    }
  } catch {
    return null
  }
}

export function downloadText(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime + ';charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
