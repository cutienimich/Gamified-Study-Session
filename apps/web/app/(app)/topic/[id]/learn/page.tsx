'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft, ChevronDown, ChevronUp,
  Lightbulb, Loader2, NotebookPen, Save, CheckCircle,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'

interface Card {
  id: string
  question: string
  answer: string
  hint?: string | null
  difficulty: number
  order: number
}

interface Topic {
  id: string
  title: string
  subject: string
  cards: Card[]
  _count: { cards: number }
}

const DIFFICULTY_LABEL: Record<number, { label: string; color: string }> = {
  1: { label: 'Easy',   color: 'text-green-400 bg-green-500/10' },
  2: { label: 'Medium', color: 'text-yellow-400 bg-yellow-500/10' },
  3: { label: 'Hard',   color: 'text-red-400 bg-red-500/10' },
}

export default function LearnPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router  = useRouter()
  const [topic,   setTopic]   = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    async function fetchTopic() {
      try {
        const res  = await fetch(`/api/topics/${params.id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setTopic(data.topic)
      } catch {
        router.back()
      }
      setLoading(false)
    }
    fetchTopic()
  }, [params.id])

  if (loading) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    </div>
  )

  if (!topic) return null

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{topic.title}</p>
          </div>
          <span className="text-gray-500 text-sm shrink-0">{topic._count.cards} cards</span>
        </div>
      </div>

      {/* Main layout — cards + notes */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6 items-start">

          {/* Left — Cards */}
          <div className="flex-1 min-w-0 space-y-3">
            <h2 className="text-white font-semibold text-lg mb-4">
              Flash Cards
              <span className="text-gray-500 text-sm font-normal ml-2">
                — click to reveal answer
              </span>
            </h2>

            {topic.cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-800 rounded-2xl">
                <p className="text-gray-500">No cards available in this topic.</p>
              </div>
            ) : (
              topic.cards.map((card, i) => (
                <FlashCard key={card.id} card={card} index={i} />
              ))
            )}
          </div>

          {/* Right — Notes (sticky) */}
          <div className="w-80 shrink-0 sticky top-36">
            <NotesPanel topicId={params.id} />
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Flash Card ──────────────────────────────────────────────────
function FlashCard({ card, index }: { card: Card; index: number }) {
  const [expanded,    setExpanded]    = useState(false)
  const [showHint,    setShowHint]    = useState(false)
  const difficulty = DIFFICULTY_LABEL[card.difficulty] || DIFFICULTY_LABEL[1]

  return (
    <div
      className={`card cursor-pointer transition-all duration-200 group ${
        expanded ? 'border-indigo-500/40 bg-gray-800/50' : 'hover:border-gray-600'
      }`}
      onClick={() => { setExpanded(!expanded); if (!expanded) setShowHint(false) }}
    >
      {/* Question row */}
      <div className="flex items-start gap-3">
        <span className="text-indigo-400 font-bold text-sm w-6 shrink-0 mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm leading-relaxed">
            {card.question}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full ${difficulty.color}`}>
            {difficulty.label}
          </span>
          {expanded
            ? <ChevronUp   className="w-4 h-4 text-gray-500" />
            : <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          }
        </div>
      </div>

      {/* Answer — shown when expanded */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-700 animate-fade-in">
          <div className="ml-9">
            <p className="text-gray-300 text-sm leading-relaxed">{card.answer}</p>

            {/* Hint */}
            {card.hint && (
              <div className="mt-3">
                {showHint ? (
                  <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-amber-300 text-xs">{card.hint}</p>
                  </div>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); setShowHint(true) }}
                    className="flex items-center gap-1.5 text-amber-500 hover:text-amber-400 text-xs transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    Show hint
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Notes Panel ─────────────────────────────────────────────────
function NotesPanel({ topicId }: { topicId: string }) {
  const [content,  setContent]  = useState('')
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  // Load existing note
  useEffect(() => {
    async function loadNote() {
      try {
        const res  = await fetch(`/api/topics/${topicId}/notes`)
        const data = await res.json()
        setContent(data.content || '')
      } catch { /* silent */ }
      setLoading(false)
    }
    loadNote()
  }, [topicId])

  // Auto-save with debounce
  const saveNote = useCallback(async (text: string) => {
    setSaving(true)
    try {
      await fetch(`/api/topics/${topicId}/notes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: text }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* silent */ }
    setSaving(false)
  }, [topicId])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value
    setContent(text)
    setSaved(false)

    // Debounce — save after 1.5s of no typing
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveNote(text), 1500)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <NotebookPen className="w-4 h-4 text-indigo-400" />
          <span className="text-white text-sm font-medium">My Notes</span>
        </div>
        <div className="flex items-center gap-1.5">
          {saving && <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />}
          {saved  && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
          {!saving && !saved && content && (
            <span className="text-gray-600 text-xs">Auto-save on</span>
          )}
        </div>
      </div>

      {/* Textarea */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
        </div>
      ) : (
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Write your notes here...&#10;&#10;Tips, summaries, key points — anything that helps you study!"
          className="w-full bg-transparent text-gray-300 text-sm placeholder-gray-700 px-4 py-3 resize-none focus:outline-none leading-relaxed"
          style={{ minHeight: '420px' }}
        />
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-800">
        <p className="text-gray-700 text-xs">Notes are saved automatically as you type</p>
      </div>
    </div>
  )
}