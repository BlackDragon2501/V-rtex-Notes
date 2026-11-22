'use client'

// Vórtex Notes - Notas markdown + Diario con calendario + Enlaces rapidos.
// Todo se guarda en el navegador (localStorage). Gratis, sin anuncios, sin nube.

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  NotebookPen,
  CalendarDays,
  Link2,
  Search,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Download,
  Upload,
  Eye,
  PenLine,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  X,
  Pencil,
  Flame,
  FileText,
  Globe,
} from 'lucide-react'
import {
  Note,
  JournalEntry,
  LinkItem,
  MOODS,
  LINK_COLORS,
  tagColor,
  newId,
  loadNotes,
  saveNotes,
  loadJournal,
  saveJournal,
  loadLinks,
  saveLinks,
  todayKey,
  longDateEs,
  monthLabel,
  calendarMatrix,
  journalStreak,
  exportBundle,
  parseBundle,
  downloadText,
} from '@/lib/notes'
import { renderMarkdown, wordCount } from '@/lib/markdown'

type Module = 'notas' | 'diario' | 'enlaces'

function VortexLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="10" fill="#161616" />
      <circle cx="24" cy="24" r="17" fill="none" stroke="#0ea5e9" strokeWidth="3.5" />
      <path d="M24 10a14 14 0 1 1-9.9 4.1" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M24 17a7 7 0 1 0 7 7" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="3" fill="#38bdf8" />
    </svg>
  )
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-[#2b2b31] bg-[#141416] px-6 py-4">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-1 text-center">
        <p className="text-[11px] text-[#9b9ba4]">
          Vórtex Notes · Derechos Reservados © 2026 Vortex Company ·{' '}
          <a href="mailto:vortexmusic.soporte.app@gmail.com" className="text-[#38bdf8] hover:underline">
            vortexmusic.soporte.app@gmail.com
          </a>
        </p>
        <p className="text-[11px] text-[#9b9ba4]">Gratis · Sin anuncios · 100% local en tu navegador</p>
      </div>
    </footer>
  )
}

const btnGhost =
  'inline-flex items-center gap-1.5 rounded-lg border border-[#2b2b31] bg-[#1e1e22] px-2.5 py-1.5 text-xs text-[#ececf1] hover:border-[#0ea5e9]/60 hover:text-[#38bdf8] transition-colors disabled:opacity-40 disabled:pointer-events-none'
const btnPrimary =
  'inline-flex items-center gap-1.5 rounded-lg bg-[#0ea5e9] px-3 py-1.5 text-xs font-semibold text-[#04121c] hover:bg-[#38bdf8] transition-colors'
const inputCls =
  'w-full rounded-lg border border-[#2b2b31] bg-[#1e1e22] px-3 py-2 text-sm text-[#ececf1] placeholder-[#6b6b75] outline-none focus:border-[#0ea5e9]/70'

export default function NotesApp() {
  const [mounted, setMounted] = useState(false)
  const [module, setModule] = useState<Module>('notas')
  const [query, setQuery] = useState('')

  const [notes, setNotes] = useState<Note[]>([])
  const [journal, setJournal] = useState<Record<string, JournalEntry>>({})
  const [links, setLinks] = useState<LinkItem[]>([])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [preview, setPreview] = useState(false)
  const [flash, setFlash] = useState('')
  const [copied, setCopied] = useState(false)

  // diario
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [dayKey, setDayKey] = useState(() => todayKey())

  // enlaces
  const [linkFormOpen, setLinkFormOpen] = useState(false)
  const [linkDraft, setLinkDraft] = useState<{ id: string | null; title: string; url: string; category: string; color: number }>({
    id: null,
    title: '',
    url: '',
    category: '',
    color: 0,
  })
  const [linkCatFilter, setLinkCatFilter] = useState<string | null>(null)

  const importRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setNotes(loadNotes())
    setJournal(loadJournal())
    setLinks(loadLinks())
    setMounted(true)
  }, [])

  const showFlash = (msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(''), 2200)
  }

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      showFlash('No se pudo copiar')
    }
  }

  // ---------- notas ----------

  const allTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const n of notes) for (const t of n.tags) counts.set(t, (counts.get(t) || 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [notes])

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notes
      .filter((n) => {
        if (tagFilter && !n.tags.includes(tagFilter)) return false
        if (!q) return true
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt)
  }, [notes, query, tagFilter])

  const selected = notes.find((n) => n.id === selectedId) || null

  const updateNote = (id: string, patch: Partial<Note>) => {
    setNotes((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
      saveNotes(next)
      return next
    })
  }

  const createNote = () => {
    const now = Date.now()
    const note: Note = { id: newId(), title: '', content: '', tags: [], pinned: false, createdAt: now, updatedAt: now }
    setNotes((prev) => {
      const next = [note, ...prev]
      saveNotes(next)
      return next
    })
    setSelectedId(note.id)
    setPreview(false)
    setTagFilter(null)
    setQuery('')
  }

  const deleteNote = (id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id)
      saveNotes(next)
      return next
    })
    if (selectedId === id) setSelectedId(null)
    showFlash('Nota eliminada')
  }

  const addTag = () => {
    if (!selected) return
    const t = tagInput.trim().replace(/^#/, '')
    if (!t || selected.tags.includes(t)) return
    updateNote(selected.id, { tags: [...selected.tags, t] })
    setTagInput('')
  }

  // ---------- diario ----------

  const saveDay = (key: string, content: string, mood?: number) => {
    setJournal((prev) => {
      const existing = prev[key]
      const next: Record<string, JournalEntry> = {
        ...prev,
        [key]: {
          date: key,
          content,
          mood: mood !== undefined ? mood : existing?.mood || 0,
          updatedAt: Date.now(),
        },
      }
      if (!content.trim() && (mood === undefined || mood === 0) && !existing?.mood) {
        delete next[key]
      }
      saveJournal(next)
      return next
    })
  }

  const weeks = useMemo(() => calendarMatrix(cursor.year, cursor.month), [cursor])
  const monthDays = useMemo(() => {
    const days = calendarMatrix(cursor.year, cursor.month).flat().filter(Boolean) as string[]
    return days
  }, [cursor])
  const monthEntries = monthDays.filter((k) => (journal[k]?.content || '').trim().length > 0)
  const monthWords = monthEntries.reduce((acc, k) => acc + wordCount(journal[k].content), 0)
  const streak = journalStreak(journal)

  const searchedEntries = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return Object.values(journal)
      .filter((e) => e.content.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [journal, query])

  const moveMonth = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  // ---------- enlaces ----------

  const linkCategories = useMemo(() => [...new Set(links.map((l) => l.category).filter(Boolean))], [links])

  const filteredLinks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return links
      .filter((l) => {
        if (linkCatFilter && l.category !== linkCatFilter) return false
        if (!q) return true
        return l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q) || l.category.toLowerCase().includes(q)
      })
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [links, query, linkCatFilter])

  const openHost = (url: string): string => {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return url
    }
  }

  const saveLink = () => {
    let url = linkDraft.url.trim()
    if (!linkDraft.title.trim() || !url) return
    if (!/^(https?:\/\/|mailto:)/i.test(url)) url = 'https://' + url
    const item: LinkItem = {
      id: linkDraft.id || newId(),
      title: linkDraft.title.trim(),
      url,
      category: linkDraft.category.trim(),
      color: linkDraft.color,
      createdAt: Date.now(),
    }
    setLinks((prev) => {
      const next = linkDraft.id ? prev.map((l) => (l.id === item.id ? item : l)) : [item, ...prev]
      saveLinks(next)
      return next
    })
    setLinkFormOpen(false)
    setLinkDraft({ id: null, title: '', url: '', category: '', color: 0 })
    showFlash(linkDraft.id ? 'Enlace actualizado' : 'Enlace guardado')
  }

  const deleteLink = (id: string) => {
    setLinks((prev) => {
      const next = prev.filter((l) => l.id !== id)
      saveLinks(next)
      return next
    })
    showFlash('Enlace eliminado')
  }

  // ---------- import / export ----------

  const doExport = () => {
    exportBundle(notes, journal, links)
    showFlash('Copia exportada')
  }

  const doImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const bundle = parseBundle(String(reader.result || ''))
      if (!bundle) {
        showFlash('Archivo no válido')
        return
      }
      const notesMap = new Map(notes.map((n) => [n.id, n]))
      for (const n of bundle.notes) notesMap.set(n.id, n)
      const mergedNotes = [...notesMap.values()].sort((a, b) => b.updatedAt - a.updatedAt)
      const mergedJournal = { ...journal }
      for (const [k, e] of Object.entries(bundle.journal)) {
        const cur = mergedJournal[k]
        if (!cur || (e.updatedAt || 0) >= (cur.updatedAt || 0)) mergedJournal[k] = e
      }
      const linksMap = new Map(links.map((l) => [l.id, l]))
      for (const l of bundle.links) linksMap.set(l.id, l)
      const mergedLinks = [...linksMap.values()].sort((a, b) => b.createdAt - a.createdAt)
      setNotes(mergedNotes)
      setJournal(mergedJournal)
      setLinks(mergedLinks)
      saveNotes(mergedNotes)
      saveJournal(mergedJournal)
      saveLinks(mergedLinks)
      showFlash(`Importado: ${bundle.notes.length} notas, ${Object.keys(bundle.journal).length} días, ${bundle.links.length} enlaces`)
    }
    reader.readAsText(file)
  }

  const counts = { notas: notes.length, diario: monthEntries.length, enlaces: links.length }
  const today = todayKey()

  const moduleMeta: { id: Module; label: string; icon: React.ReactNode }[] = [
    { id: 'notas', label: 'Notas', icon: <NotebookPen className="h-4 w-4" aria-hidden /> },
    { id: 'diario', label: 'Diario', icon: <CalendarDays className="h-4 w-4" aria-hidden /> },
    { id: 'enlaces', label: 'Enlaces', icon: <Link2 className="h-4 w-4" aria-hidden /> },
  ]

  if (!mounted) {
    return <div className="min-h-screen bg-[#0f0f10]" />
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f10] text-[#ececf1]">
      {/* barra superior */}
      <header className="sticky top-0 z-20 border-b border-[#2b2b31] bg-[#141416]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <VortexLogo className="h-7 w-7 shrink-0" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">
              Vórtex <span className="text-[#38bdf8]">Notes</span>
            </h1>
          </div>
          <div className="relative ml-auto w-44 sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b75]" aria-hidden />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                module === 'notas' ? 'Buscar notas…' : module === 'diario' ? 'Buscar en el diario…' : 'Buscar enlaces…'
              }
              className={inputCls + ' pl-8 py-1.5 text-xs'}
              aria-label="Buscar"
            />
          </div>
          <button type="button" className={btnGhost + ' px-2'} onClick={doExport} title="Exportar copia (.json)" aria-label="Exportar copia">
            <Download className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" className={btnGhost + ' px-2'} onClick={() => importRef.current?.click()} title="Importar copia (.json)" aria-label="Importar copia">
            <Upload className="h-4 w-4" aria-hidden />
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) doImport(f)
              e.target.value = ''
            }}
          />
        </div>
        {flash && (
          <div className="pointer-events-none absolute inset-x-0 top-full mt-1 flex justify-center">
            <span className="rounded-full border border-[#0ea5e9]/40 bg-[#0f0f10] px-3 py-1 text-[11px] text-[#38bdf8] shadow-lg">
              {flash}
            </span>
          </div>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-4 px-4 py-4">
        {/* barra lateral modulos */}
        <nav className="hidden w-44 shrink-0 flex-col gap-1 md:flex" aria-label="Módulos">
          {moduleMeta.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setModule(m.id)
                setQuery('')
                setTagFilter(null)
                setLinkCatFilter(null)
              }}
              className={
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ' +
                (module === m.id
                  ? 'bg-[#0ea5e9]/10 text-[#38bdf8] border border-[#0ea5e9]/40'
                  : 'text-[#9b9ba4] hover:bg-[#1e1e22] border border-transparent')
              }
            >
              {m.icon}
              <span className="flex-1 text-left">{m.label}</span>
              <span className="text-[11px] text-[#6b6b75]">{m.id === 'notas' ? counts.notas : m.id === 'enlaces' ? counts.enlaces : monthEntries.length}</span>
            </button>
          ))}

          {module === 'notas' && allTags.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 px-3 text-[11px] uppercase tracking-wider text-[#6b6b75]">Etiquetas</p>
              <div className="flex flex-wrap gap-1.5 px-2">
                {allTags.map(([t, c]) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTagFilter(tagFilter === t ? null : t)}
                    className={
                      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-colors ' +
                      (tagFilter === t ? 'border-white/40 text-[#ececf1]' : 'border-transparent text-[#9b9ba4] hover:border-[#2b2b31]')
                    }
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: tagColor(t) }} aria-hidden />
                    {t} <span className="text-[#6b6b75]">{c}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {module === 'enlaces' && linkCategories.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 px-3 text-[11px] uppercase tracking-wider text-[#6b6b75]">Categorías</p>
              <div className="flex flex-wrap gap-1.5 px-2">
                {linkCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setLinkCatFilter(linkCatFilter === c ? null : c)}
                    className={
                      'rounded-full border px-2 py-0.5 text-[11px] transition-colors ' +
                      (linkCatFilter === c ? 'border-white/40 text-[#ececf1]' : 'border-transparent text-[#9b9ba4] hover:border-[#2b2b31]')
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-auto px-3 text-[11px] leading-relaxed text-[#6b6b75]">
            Todo se guarda en tu navegador. Exporta una copia de vez en cuando.
          </p>
        </nav>

        {/* chips modulos movil */}
        <div className="md:hidden absolute" />

        {/* contenido */}
        <main className="min-w-0 flex-1">
          {/* selector movil */}
          <div className="mb-3 flex gap-1.5 md:hidden">
            {moduleMeta.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setModule(m.id)
                  setQuery('')
                  setTagFilter(null)
                  setLinkCatFilter(null)
                }}
                className={
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ' +
                  (module === m.id ? 'border-[#0ea5e9]/50 bg-[#0ea5e9]/10 text-[#38bdf8]' : 'border-[#2b2b31] text-[#9b9ba4]')
                }
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {/* ============ MODULO NOTAS ============ */}
          {module === 'notas' && (
            <div className="flex gap-4">
              {/* lista */}
              <section
                className={
                  'w-full shrink-0 flex-col md:flex md:w-72 ' +
                  (selected && 'hidden md:flex') +
                  ' flex-col'
                }
                aria-label="Lista de notas"
              >
                <button type="button" onClick={createNote} className={btnPrimary + ' mb-3 w-full justify-center'}>
                  <Plus className="h-4 w-4" aria-hidden /> Nueva nota
                </button>
                <div className="flex-1 space-y-2 overflow-y-auto md:max-h-[calc(100vh-11rem)]">
                  {filteredNotes.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[#2b2b31] p-6 text-center text-xs text-[#6b6b75]">
                      <FileText className="mx-auto mb-2 h-6 w-6" aria-hidden />
                      {notes.length === 0 ? 'Aún no hay notas. Crea la primera.' : 'Sin resultados para tu búsqueda.'}
                    </div>
                  )}
                  {filteredNotes.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(n.id)
                        setPreview(false)
                      }}
                      className={
                        'w-full rounded-xl border p-3 text-left transition-colors ' +
                        (selectedId === n.id
                          ? 'border-[#0ea5e9]/60 bg-[#0ea5e9]/10'
                          : 'border-[#2b2b31] bg-[#17171a] hover:border-[#3a3a42]')
                      }
                    >
                      <div className="flex items-center gap-1.5">
                        {n.pinned && <Pin className="h-3 w-3 shrink-0 text-[#38bdf8]" aria-hidden />}
                        <span className="truncate text-sm font-medium">{n.title || 'Sin título'}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-[#9b9ba4]">{n.content.replace(/[#*`>\-[\]()]/g, '').slice(0, 120) || 'Vacía'}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {n.tags.slice(0, 3).map((t) => (
                          <span key={t} className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: tagColor(t) + '26', color: tagColor(t) }}>
                            #{t}
                          </span>
                        ))}
                        <span className="ml-auto text-[10px] text-[#6b6b75]">
                          {new Date(n.updatedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* editor */}
              <section className={'min-w-0 flex-1 ' + (selected ? 'flex flex-col' : 'hidden md:flex md:flex-col')} aria-label="Editor de nota">
                {!selected ? (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#2b2b31] p-10 text-center text-sm text-[#6b6b75]">
                    Selecciona una nota o crea una nueva.
                  </div>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-[#2b2b31] bg-[#17171a]">
                    <div className="border-b border-[#2b2b31] p-3">
                      <button type="button" className={btnGhost + ' mb-2 md:hidden'} onClick={() => setSelectedId(null)}>
                        <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Volver
                      </button>
                      <input
                        value={selected.title}
                        onChange={(e) => updateNote(selected.id, { title: e.target.value })}
                        placeholder="Título de la nota"
                        className="w-full bg-transparent text-lg font-semibold outline-none placeholder-[#6b6b75]"
                        aria-label="Título"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {selected.tags.map((t) => (
                          <span key={t} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]" style={{ background: tagColor(t) + '26', color: tagColor(t) }}>
                            #{t}
                            <button type="button" onClick={() => updateNote(selected.id, { tags: selected.tags.filter((x) => x !== t) })} aria-label={'Quitar etiqueta ' + t}>
                              <X className="h-3 w-3" aria-hidden />
                            </button>
                          </span>
                        ))}
                        <input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addTag()}
                          placeholder="+ etiqueta"
                          className="w-24 rounded-full border border-dashed border-[#2b2b31] bg-transparent px-2 py-0.5 text-[11px] outline-none focus:border-[#0ea5e9]/60"
                          aria-label="Añadir etiqueta"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 border-b border-[#2b2b31] px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setPreview(!preview)}
                        className={btnGhost}
                        title={preview ? 'Editar markdown' : 'Vista previa'}
                      >
                        {preview ? <PenLine className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
                        {preview ? 'Editar' : 'Vista previa'}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateNote(selected.id, { pinned: !selected.pinned })}
                        className={btnGhost}
                        title={selected.pinned ? 'Quitar fijado' : 'Fijar nota'}
                      >
                        {selected.pinned ? <PinOff className="h-3.5 w-3.5" aria-hidden /> : <Pin className="h-3.5 w-3.5" aria-hidden />}
                        {selected.pinned ? 'Quitar fijado' : 'Fijar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadText((selected.title || 'nota') + '.md', selected.content, 'text/markdown')}
                        className={btnGhost}
                        title="Descargar .md"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden /> .md
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('¿Eliminar esta nota? Esta acción no se puede deshacer.')) deleteNote(selected.id)
                        }}
                        className={btnGhost + ' hover:border-red-500/60 hover:text-red-400'}
                        title="Eliminar nota"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <span className="ml-auto text-[11px] text-[#6b6b75]">
                        {wordCount(selected.content)} palabras · {selected.content.length} caracteres
                      </span>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                      {preview ? (
                        selected.content.trim() ? (
                          <div
                            className="prose-notes p-4 text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(selected.content) }}
                          />
                        ) : (
                          <p className="p-4 text-sm text-[#6b6b75]">La nota está vacía.</p>
                        )
                      ) : (
                        <textarea
                          value={selected.content}
                          onChange={(e) => updateNote(selected.id, { content: e.target.value })}
                          placeholder={'Escribe en markdown…\n\n# Título\n- lista\n**negrita** *cursiva* `código`\n[enlace](https://ejemplo.com)'}
                          className="h-full min-h-[16rem] w-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed outline-none placeholder-[#6b6b75]"
                          aria-label="Contenido en markdown"
                        />
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ============ MODULO DIARIO ============ */}
          {module === 'diario' && (
            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
              <section className="space-y-3" aria-label="Calendario del diario">
                <div className="rounded-xl border border-[#2b2b31] bg-[#17171a] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <button type="button" onClick={() => moveMonth(-1)} className={btnGhost + ' px-2'} aria-label="Mes anterior">
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                    </button>
                    <h2 className="text-sm font-semibold capitalize">{monthLabel(cursor.year, cursor.month)}</h2>
                    <button type="button" onClick={() => moveMonth(1)} className={btnGhost + ' px-2'} aria-label="Mes siguiente">
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-[#6b6b75]">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
                      <span key={i}>{d}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {weeks.flat().map((key, i) => {
                      if (!key) return <span key={'e' + i} />
                      const dayNum = Number(key.slice(-2))
                      const hasEntry = (journal[key]?.content || '').trim().length > 0
                      const mood = journal[key]?.mood || 0
                      const isToday = key === today
                      const isSel = key === dayKey
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setDayKey(key)
                            setQuery('')
                          }}
                          className={
                            'relative flex h-9 flex-col items-center justify-center rounded-lg text-xs transition-colors ' +
                            (isSel
                              ? 'bg-[#0ea5e9] font-bold text-[#04121c]'
                              : isToday
                                ? 'border border-[#0ea5e9]/60 text-[#38bdf8]'
                                : 'text-[#9b9ba4] hover:bg-[#1e1e22]')
                          }
                        >
                          {dayNum}
                          {hasEntry && (
                            <span
                              className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full"
                              style={{ background: isSel ? '#04121c' : mood > 0 ? MOODS[mood - 1].color : '#38bdf8' }}
                              aria-hidden
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-[#2b2b31] bg-[#17171a] p-3 text-center">
                    <Flame className="mx-auto mb-1 h-4 w-4 text-[#fb923c]" aria-hidden />
                    <p className="text-lg font-bold">{streak}</p>
                    <p className="text-[10px] text-[#6b6b75]">racha de días</p>
                  </div>
                  <div className="rounded-xl border border-[#2b2b31] bg-[#17171a] p-3 text-center">
                    <CalendarDays className="mx-auto mb-1 h-4 w-4 text-[#38bdf8]" aria-hidden />
                    <p className="text-lg font-bold">{monthEntries.length}</p>
                    <p className="text-[10px] text-[#6b6b75]">días este mes</p>
                  </div>
                  <div className="rounded-xl border border-[#2b2b31] bg-[#17171a] p-3 text-center">
                    <NotebookPen className="mx-auto mb-1 h-4 w-4 text-[#38bdf8]" aria-hidden />
                    <p className="text-lg font-bold">{monthWords}</p>
                    <p className="text-[10px] text-[#6b6b75]">palabras</p>
                  </div>
                </div>

                {searchedEntries.length > 0 && (
                  <div className="rounded-xl border border-[#2b2b31] bg-[#17171a] p-3">
                    <p className="mb-2 text-[11px] uppercase tracking-wider text-[#6b6b75]">Resultados</p>
                    <div className="max-h-40 space-y-1 overflow-y-auto">
                      {searchedEntries.map((e) => (
                        <button
                          key={e.date}
                          type="button"
                          onClick={() => {
                            const d = parseKey(e.date)
                            setCursor({ year: d.getFullYear(), month: d.getMonth() })
                            setDayKey(e.date)
                          }}
                          className="block w-full truncate rounded-lg px-2 py-1 text-left text-xs text-[#9b9ba4] hover:bg-[#1e1e22]"
                        >
                          {longDateEs(e.date)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="flex flex-col rounded-xl border border-[#2b2b31] bg-[#17171a]" aria-label="Entrada del día">
                <div className="border-b border-[#2b2b31] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold capitalize">{longDateEs(dayKey)}</h2>
                    <div className="flex items-center gap-1.5">
                      {MOODS.map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => saveDay(dayKey, journal[dayKey]?.content || '', m.value)}
                          title={m.label}
                          aria-label={'Estado: ' + m.label}
                          className={
                            'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ' +
                            ((journal[dayKey]?.mood || 0) === m.value ? 'border-white' : 'border-transparent')
                          }
                          style={{ background: m.color }}
                        />
                      ))}
                    </div>
                  </div>
                  {journal[dayKey]?.mood ? (
                    <p className="mt-1 text-[11px] text-[#6b6b75]">Cómo fue el día: {MOODS[journal[dayKey].mood - 1].label}</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-[#6b6b75]">Marca cómo fue el día (opcional) y escribe tu entrada.</p>
                  )}
                </div>
                <textarea
                  value={journal[dayKey]?.content || ''}
                  onChange={(e) => saveDay(dayKey, e.target.value)}
                  placeholder={'¿Cómo estuvo tu día?\n\nEscribe libremente: se guarda automáticamente con la fecha.'}
                  className="min-h-[16rem] flex-1 resize-none bg-transparent p-4 text-sm leading-relaxed outline-none placeholder-[#6b6b75]"
                  aria-label="Entrada del diario"
                />
                <p className="border-t border-[#2b2b31] px-4 py-2 text-[11px] text-[#6b6b75]">
                  {wordCount(journal[dayKey]?.content || '')} palabras · guardado automático
                </p>
              </section>
            </div>
          )}

          {/* ============ MODULO ENLACES ============ */}
          {module === 'enlaces' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setLinkFormOpen(!linkFormOpen)
                    setLinkDraft({ id: null, title: '', url: '', category: '', color: 0 })
                  }}
                  className={btnPrimary}
                >
                  {linkFormOpen ? <X className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                  {linkFormOpen ? 'Cancelar' : 'Nuevo enlace'}
                </button>
                {linkCatFilter && (
                  <button type="button" onClick={() => setLinkCatFilter(null)} className={btnGhost}>
                    Filtro: {linkCatFilter} <X className="h-3 w-3" aria-hidden />
                  </button>
                )}
              </div>

              {linkFormOpen && (
                <div className="rounded-xl border border-[#2b2b31] bg-[#17171a] p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={linkDraft.title}
                      onChange={(e) => setLinkDraft({ ...linkDraft, title: e.target.value })}
                      placeholder="Nombre (ej. Soporte Vórtex)"
                      className={inputCls}
                      aria-label="Nombre del enlace"
                    />
                    <input
                      value={linkDraft.url}
                      onChange={(e) => setLinkDraft({ ...linkDraft, url: e.target.value })}
                      placeholder="URL (ej. https://…)"
                      className={inputCls}
                      inputMode="url"
                      aria-label="URL"
                    />
                    <input
                      value={linkDraft.category}
                      onChange={(e) => setLinkDraft({ ...linkDraft, category: e.target.value })}
                      placeholder="Categoría (ej. Trabajo, Personal)"
                      className={inputCls}
                      aria-label="Categoría"
                    />
                    <div className="flex items-center gap-1.5">
                      {LINK_COLORS.map((c, i) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setLinkDraft({ ...linkDraft, color: i })}
                          aria-label={'Color ' + c.name}
                          className={
                            'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ' +
                            (linkDraft.color === i ? 'border-white' : 'border-transparent')
                          }
                          style={{ background: c.value }}
                        />
                      ))}
                    </div>
                  </div>
                  <button type="button" onClick={saveLink} className={btnPrimary + ' mt-3'} disabled={!linkDraft.title.trim() || !linkDraft.url.trim()}>
                    <Check className="h-4 w-4" aria-hidden /> {linkDraft.id ? 'Guardar cambios' : 'Guardar enlace'}
                  </button>
                </div>
              )}

              {filteredLinks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#2b2b31] p-10 text-center text-sm text-[#6b6b75]">
                  <Globe className="mx-auto mb-2 h-6 w-6" aria-hidden />
                  {links.length === 0 ? 'Guarda aquí tus sitios de cada día para tenerlos a un clic.' : 'Sin resultados.'}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredLinks.map((l) => (
                    <div key={l.id} className="rounded-xl border border-[#2b2b31] bg-[#17171a] p-4 transition-colors hover:border-[#0ea5e9]/50">
                      <div className="flex items-start gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                          style={{ background: LINK_COLORS[l.color].value + '26', color: LINK_COLORS[l.color].value }}
                          aria-hidden
                        >
                          {(l.title || '?').slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{l.title}</p>
                          <p className="truncate text-[11px] text-[#6b6b75]">{openHost(l.url)}</p>
                        </div>
                      </div>
                      {l.category && (
                        <span className="mt-2 inline-block rounded-full bg-[#1e1e22] px-2 py-0.5 text-[10px] text-[#9b9ba4]">{l.category}</span>
                      )}
                      <div className="mt-3 flex items-center gap-1">
                        <button type="button" onClick={() => window.open(l.url, '_blank', 'noopener,noreferrer')} className={btnGhost + ' px-2'} title="Abrir" aria-label={'Abrir ' + l.title}>
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button type="button" onClick={() => copyText(l.url)} className={btnGhost + ' px-2'} title="Copiar URL" aria-label="Copiar URL">
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLinkDraft({ id: l.id, title: l.title, url: l.url, category: l.category, color: l.color })
                            setLinkFormOpen(true)
                          }}
                          className={btnGhost + ' px-2'}
                          title="Editar"
                          aria-label="Editar enlace"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => window.confirm('¿Eliminar este enlace?') && deleteLink(l.id)}
                          className={btnGhost + ' px-2 hover:border-red-500/60 hover:text-red-400'}
                          title="Eliminar"
                          aria-label="Eliminar enlace"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  )
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
