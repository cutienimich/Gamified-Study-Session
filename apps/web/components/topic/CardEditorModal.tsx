'use client'

import { useState } from 'react'
import { X, Loader2, Plus, Trash2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface CardEditorModalProps {
  topicId: string
  card?: {
    id: string
    question: string
    answer: string
    hint?: string | null
    difficulty: number
    type: 'IDENTIFICATION' | 'MULTIPLE_CHOICE'
    choices: string[]
  }
  onClose: () => void
  onSuccess: (card: any) => void
}

const DIFFICULTY_OPTIONS = [
  { value: 1, label: 'Easy',   color: 'text-green-400 bg-green-500/10 border-green-500/20'  },
  { value: 2, label: 'Medium', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { value: 3, label: 'Hard',   color: 'text-red-400 bg-red-500/10 border-red-500/20'         },
]

export default function CardEditorModal({
  topicId, card, onClose, onSuccess,
}: CardEditorModalProps) {
  const isEditing = !!card

  const [question,   setQuestion]   = useState(card?.question   || '')
  const [answer,     setAnswer]     = useState(card?.answer     || '')
  const [hint,       setHint]       = useState(card?.hint       || '')
  const [difficulty, setDifficulty] = useState(card?.difficulty || 1)
  const [type,       setType]       = useState<'IDENTIFICATION' | 'MULTIPLE_CHOICE'>(card?.type || 'IDENTIFICATION')
  const [choices,    setChoices]    = useState<string[]>(
    card?.choices?.length ? card.choices : ['', '', '', '']
  )
  const [loading,    setLoading]    = useState(false)

  function updateChoice(index: number, value: string) {
    setChoices(prev => prev.map((c, i) => i === index ? value : c))
  }

  function addChoice() {
    if (choices.length >= 6) return
    setChoices(prev => [...prev, ''])
  }

  function removeChoice(index: number) {
    if (choices.length <= 2) return
    setChoices(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!question.trim() || !answer.trim()) {
      toast.error('Question at answer ay required')
      return
    }

    if (type === 'MULTIPLE_CHOICE') {
      const filledChoices = choices.filter(c => c.trim())
      if (filledChoices.length < 2) {
        toast.error('Kailangan ng at least 2 choices')
        return
      }
      const answerInChoices = choices.some(c => c.trim().toLowerCase() === answer.trim().toLowerCase())
      if (!answerInChoices) {
        toast.error('Ang correct answer ay dapat nandoon sa choices')
        return
      }
    }

    setLoading(true)
    try {
      const url    = isEditing ? `/api/cards/${card!.id}` : '/api/cards'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          question:  question.trim(),
          answer:    answer.trim(),
          hint:      hint.trim() || null,
          difficulty,
          type,
          choices:   type === 'MULTIPLE_CHOICE'
            ? choices.filter(c => c.trim())
            : [],
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(isEditing ? 'Na-update ang card!' : 'Nagdagdag ng bagong card!')
      onSuccess(data.card)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'May error na nangyari')
    }
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-pop">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <h2 className="text-white font-semibold text-lg">
            {isEditing ? 'I-edit ang Card' : 'Magdagdag ng Card'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">

          {/* Card Type */}
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Card Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setType('IDENTIFICATION')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-all ${
                  type === 'IDENTIFICATION'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                }`}
              >
                <span className="text-lg">✏️</span>
                <span>Identification</span>
                <span className="text-xs font-normal text-gray-500">Mag-type ng sagot</span>
              </button>
              <button
                onClick={() => setType('MULTIPLE_CHOICE')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-all ${
                  type === 'MULTIPLE_CHOICE'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                }`}
              >
                <span className="text-lg">🔤</span>
                <span>Multiple Choice</span>
                <span className="text-xs font-normal text-gray-500">Pumili sa choices</span>
              </button>
            </div>
          </div>

          {/* Question */}
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Question *</label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ano ang tanong?"
              rows={3}
              className="input resize-none"
            />
          </div>

          {/* Answer */}
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">
              Correct Answer *
              {type === 'MULTIPLE_CHOICE' && (
                <span className="text-gray-600 text-xs ml-1">— dapat nandoon sa choices</span>
              )}
            </label>
            <input
              type="text"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Ano ang tamang sagot?"
              className="input"
            />
          </div>

          {/* Multiple Choice — choices input */}
          {type === 'MULTIPLE_CHOICE' && (
            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">
                Choices *
                <span className="text-gray-600 text-xs ml-1">({choices.length}/6)</span>
              </label>
              <div className="space-y-2">
                {choices.map((choice, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {/* Correct answer indicator */}
                    <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      choice.trim() && choice.trim().toLowerCase() === answer.trim().toLowerCase()
                        ? 'bg-green-500'
                        : 'bg-gray-700'
                    }`}>
                      {choice.trim() && choice.trim().toLowerCase() === answer.trim().toLowerCase() && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <input
                      type="text"
                      value={choice}
                      onChange={e => updateChoice(i, e.target.value)}
                      placeholder={`Choice ${i + 1}`}
                      className="input flex-1 py-2"
                    />
                    {choices.length > 2 && (
                      <button
                        onClick={() => removeChoice(i)}
                        className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {choices.length < 6 && (
                  <button
                    onClick={addChoice}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors mt-1"
                  >
                    <Plus className="w-4 h-4" />
                    Magdagdag ng choice
                  </button>
                )}
              </div>
              <p className="text-gray-600 text-xs mt-2">
                Ang choice na katumbas ng correct answer ay awtomatikong ma-hi-highlight
              </p>
            </div>
          )}

          {/* Hint */}
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">
              Hint <span className="text-gray-600">(optional)</span>
            </label>
            <input
              type="text"
              value={hint}
              onChange={e => setHint(e.target.value)}
              placeholder="Bigyan ng hint ang mga player..."
              className="input"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    difficulty === opt.value
                      ? opt.color
                      : 'text-gray-500 bg-gray-800 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-800 shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !question.trim() || !answer.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? 'I-save ang Changes' : 'Idagdag ang Card'}
          </button>
        </div>
      </div>
    </div>
  )
}