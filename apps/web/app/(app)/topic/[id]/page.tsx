'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft, BookOpen, Zap, Users,
  Clock, User, Loader2, Globe, Lock,
  Plus, Pencil, Trash2, Check, X,
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import CardEditorModal from '@/components/topic/CardEditorModal'

interface Card {
  id: string
  question: string
  answer: string
  hint?: string | null
  difficulty: number
  order: number
  type: 'IDENTIFICATION' | 'MULTIPLE_CHOICE'
  choices: string[]
}

interface Topic {
  id: string
  title: string
  subject: string
  isPublic: boolean
  createdAt: string
  author: { id: string; name: string | null; image: string | null }
  cards: Card[]
  _count: { cards: number }
}

const SUBJECTS = [
  'Mathematics', 'Science', 'Biology', 'Chemistry', 'Physics',
  'History', 'English', 'Filipino', 'Computer Science',
  'Social Studies', 'Economics', 'Other',
]

const SUBJECT_COLORS: Record<string, string> = {
  'Mathematics':      'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Science':          'text-green-400 bg-green-500/10 border-green-500/20',
  'Biology':          'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Chemistry':        'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Physics':          'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'History':          'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'English':          'text-pink-400 bg-pink-500/10 border-pink-500/20',
  'Filipino':         'text-red-400 bg-red-500/10 border-red-500/20',
  'Computer Science': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  'Other':            'text-gray-400 bg-gray-500/10 border-gray-500/20',
}

export default function TopicPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router  = useRouter()
  const [topic,       setTopic]       = useState<Topic | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [showEditor,  setShowEditor]  = useState(false)
  const [editingCard, setEditingCard] = useState<Card | undefined>(undefined)

  // Edit topic state
  const [editingTitle,   setEditingTitle]   = useState(false)
  const [editingSubject, setEditingSubject] = useState(false)
  const [titleInput,     setTitleInput]     = useState('')
  const [subjectInput,   setSubjectInput]   = useState('')
  const [savingField,    setSavingField]    = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => { fetchTopic() }, [params.id])

  async function fetchTopic() {
    try {
      const res  = await fetch(`/api/topics/${params.id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTopic(data.topic)
      setTitleInput(data.topic.title)
      setSubjectInput(data.topic.subject)
    } catch (err: any) {
      setError(err.message || 'Failed to load topic')
    }
    setLoading(false)
  }

  async function updateField(field: string, value: any) {
    if (!topic) return
    setSavingField(field)
    try {
      const res = await fetch(`/api/topics/${topic.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ [field]: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTopic(prev => prev ? { ...prev, [field]: value } : prev)
      toast.success('Na-update!')
    } catch (err: any) {
      toast.error(err.message || 'Hindi ma-update')
    }
    setSavingField(null)
    setEditingTitle(false)
    setEditingSubject(false)
  }

  async function handleDeleteTopic() {
    if (!confirm(`I-delete ang topic na "${topic?.title}"? Hindi na ito maibabalik.`)) return
    try {
      const res = await fetch(`/api/topics/${topic!.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Na-delete ang topic')
      router.push('/dashboard')
    } catch {
      toast.error('Hindi ma-delete ang topic')
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!confirm('I-delete ang card na ito?')) return
    try {
      const res = await fetch(`/api/cards/${cardId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Na-delete ang card')
      setTopic(prev => prev ? {
        ...prev,
        cards:  prev.cards.filter(c => c.id !== cardId),
        _count: { cards: prev._count.cards - 1 },
      } : prev)
    } catch {
      toast.error('Hindi ma-delete ang card')
    }
  }

  function handleCardSuccess(card: Card) {
    setTopic(prev => {
      if (!prev) return prev
      const exists = prev.cards.find(c => c.id === card.id)
      if (exists) {
        return { ...prev, cards: prev.cards.map(c => c.id === card.id ? card : c) }
      }
      return { ...prev, cards: [...prev.cards, card], _count: { cards: prev._count.cards + 1 } }
    })
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    </div>
  )

  if (error || !topic) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <p className="text-gray-400">{error || 'Topic not found'}</p>
        <button onClick={() => router.back()} className="btn-secondary">Bumalik</button>
      </div>
    </div>
  )

  const subjectColor = SUBJECT_COLORS[topic.subject] || SUBJECT_COLORS['Other']
  const isOwner = (session?.user as any)?.id === topic.author.id

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Bumalik sa dashboard
        </button>

        {/* Topic header */}
        <div className="card p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">

              {/* Subject — editable for owner */}
              <div className="flex items-center gap-2 mb-3">
                {isOwner && editingSubject ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={subjectInput}
                      onChange={e => setSubjectInput(e.target.value)}
                      className="input text-sm py-1 w-48"
                      autoFocus
                    >
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => updateField('subject', subjectInput)}
                      disabled={savingField === 'subject'}
                      className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                    >
                      {savingField === 'subject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => { setEditingSubject(false); setSubjectInput(topic.subject) }}
                      className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-3 py-1 rounded-lg border ${subjectColor}`}>
                      {topic.subject}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => setEditingSubject(true)}
                        className="p-1 rounded text-gray-600 hover:text-gray-400 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Visibility */}
                {topic.isPublic
                  ? <span className="flex items-center gap-1 text-gray-500 text-xs"><Globe className="w-3 h-3" /> Public</span>
                  : <span className="flex items-center gap-1 text-gray-500 text-xs"><Lock  className="w-3 h-3" /> Private</span>
                }
              </div>

              {/* Title — editable for owner */}
              {isOwner && editingTitle ? (
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={e => setTitleInput(e.target.value)}
                    className="input text-xl font-bold flex-1"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') updateField('title', titleInput)
                      if (e.key === 'Escape') { setEditingTitle(false); setTitleInput(topic.title) }
                    }}
                  />
                  <button
                    onClick={() => updateField('title', titleInput)}
                    disabled={savingField === 'title'}
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shrink-0"
                  >
                    {savingField === 'title' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setEditingTitle(false); setTitleInput(topic.title) }}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-4 group/title">
                  <h1 className="text-3xl font-bold text-white">{topic.title}</h1>
                  {isOwner && (
                    <button
                      onClick={() => setEditingTitle(true)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-gray-400 transition-colors opacity-0 group-hover/title:opacity-100"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>{topic._count.cards} cards</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  {topic.author.image
                    ? <Image src={topic.author.image} alt={topic.author.name || ''} width={20} height={20} className="rounded-full" />
                    : <User className="w-4 h-4" />
                  }
                  <span>{topic.author.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(topic.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="flex flex-col items-end gap-3 shrink-0">
                {/* Public toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">
                    {topic.isPublic ? 'Public' : 'Private'}
                  </span>
                  <button
                    onClick={() => updateField('isPublic', !topic.isPublic)}
                    disabled={savingField === 'isPublic'}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${topic.isPublic ? 'bg-indigo-600' : 'bg-gray-600'}`}
                  >
                    {savingField === 'isPublic'
                      ? <Loader2 className="w-3 h-3 text-white animate-spin absolute inset-0 m-auto" />
                      : <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${topic.isPublic ? 'translate-x-6' : 'translate-x-0'}`} />
                    }
                  </button>
                </div>

                {/* Delete topic */}
                <button
                  onClick={handleDeleteTopic}
                  className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete topic
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mode selector */}
        <h2 className="text-white font-semibold text-lg mb-4">Piliin ang mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <button
            onClick={() => router.push(`/topic/${topic.id}/learn`)}
            className="mode-card group border border-gray-800 hover:border-indigo-500/50 hover:bg-indigo-500/5"
          >
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
              <BookOpen className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Learn</p>
              <p className="text-gray-400 text-sm mt-1">Basahin ang content at aralin ang mga cards</p>
            </div>
          </button>

          <button
            onClick={() => router.push(`/topic/${topic.id}/solo`)}
            className="mode-card group border border-gray-800 hover:border-yellow-500/50 hover:bg-yellow-500/5"
          >
            <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 group-hover:bg-yellow-500/20 transition-colors">
              <Zap className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Solo Challenge</p>
              <p className="text-gray-400 text-sm mt-1">
                There are <span className="text-white font-medium">{topic._count.cards}</span> sets of questions. Play to proceed.
              </p>
            </div>
          </button>

          <button
            onClick={() => router.push(`/topic/${topic.id}/challenge`)}
            className="mode-card group border border-gray-800 hover:border-amber-500/50 hover:bg-amber-500/5"
          >
            <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
              <Users className="w-8 h-8 text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Challenge Friends</p>
              <p className="text-gray-400 text-sm mt-1">Mag-create ng room at i-invite ang mga kaibigan</p>
            </div>
          </button>
        </div>

        {/* Cards section — owner only */}
        {isOwner && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-semibold text-lg">Mga Cards</h2>
                <p className="text-gray-500 text-sm">{topic.cards.length} cards total</p>
              </div>
              <button
                onClick={() => { setEditingCard(undefined); setShowEditor(true) }}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Magdagdag ng Card
              </button>
            </div>

            <div className="space-y-3">
              {topic.cards.map((card, i) => (
                <div key={card.id} className="card p-4 group">
                  <div className="flex items-start gap-4">
                    <span className="text-indigo-400 font-bold text-sm w-6 shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{card.question}</p>
                      <p className="text-gray-400 text-sm mt-1">{card.answer}</p>
                      {card.hint && (
                        <p className="text-gray-600 text-xs mt-1.5 italic">Hint: {card.hint}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        card.difficulty === 1 ? 'bg-green-500/10 text-green-400' :
                        card.difficulty === 2 ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {card.difficulty === 1 ? 'Easy' : card.difficulty === 2 ? 'Medium' : 'Hard'}
                      </span>
                      <button
                        onClick={() => { setEditingCard(card); setShowEditor(true) }}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {topic.cards.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-800 rounded-2xl">
                  <BookOpen className="w-10 h-10 text-gray-700 mb-3" />
                  <p className="text-gray-500 text-sm">Walang cards pa</p>
                  <button
                    onClick={() => { setEditingCard(undefined); setShowEditor(true) }}
                    className="btn-primary mt-4 flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Magdagdag ng unang card
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showEditor && (
        <CardEditorModal
          topicId={topic.id}
          card={editingCard}
          onClose={() => setShowEditor(false)}
          onSuccess={handleCardSuccess}
        />
      )}
    </div>
  )
}