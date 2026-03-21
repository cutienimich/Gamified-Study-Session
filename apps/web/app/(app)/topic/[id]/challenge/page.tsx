'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft, Zap, Timer, Play, RotateCcw,
  CheckCircle, XCircle, Loader2, Star, Home,
  ChevronRight, Clock,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'

interface Card {
  id: string
  question: string
  answer: string
  hint?: string | null
  difficulty: number
  type: 'IDENTIFICATION' | 'MULTIPLE_CHOICE'
  choices: string[]
  order: number
}

interface Topic {
  id: string
  title: string
  subject: string
  cards: Card[]
  _count: { cards: number }
}

type GameState = 'start' | 'playing' | 'answer_reveal' | 'results'

const TIMER_OPTIONS = [15, 30, 60]

// Shuffle array
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function calculateEXP(score: number, total: number, timerOn: boolean, timePerCard: number): number {
  const accuracy    = score / total
  const baseEXP     = Math.round(score * 100 * accuracy)
  const timerBonus  = timerOn ? Math.round(timePerCard * 2) : 0
  const perfectBonus = score === total ? 200 : 0
  return baseEXP + timerBonus + perfectBonus
}

export default function SoloChallengePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [topic,     setTopic]     = useState<Topic | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [gameState, setGameState] = useState<GameState>('start')

  // Settings
  const [timerOn,      setTimerOn]      = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(30)

  // Game state
  const [cards,        setCards]        = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score,        setScore]        = useState(0)
  const [userAnswer,   setUserAnswer]   = useState('')
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [isCorrect,    setIsCorrect]    = useState<boolean | null>(null)
  const [timeLeft,     setTimeLeft]     = useState(0)
  const [expGained,    setExpGained]    = useState(0)
  const [results,      setResults]      = useState<{ card: Card; correct: boolean; userAnswer: string }[]>([])

  const timerRef   = useRef<NodeJS.Timeout | null>(null)
  const inputRef   = useRef<HTMLInputElement>(null)

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
      } catch { router.back() }
      setLoading(false)
    }
    fetchTopic()
  }, [params.id])

  // Timer logic
  useEffect(() => {
    if (gameState !== 'playing' || !timerOn) return
    setTimeLeft(timerSeconds)

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [currentIndex, gameState, timerOn])

  function handleTimeUp() {
    const card = cards[currentIndex]
    setIsCorrect(false)
    setResults(prev => [...prev, { card, correct: false, userAnswer: '(Time up)' }])
    setGameState('answer_reveal')
  }

  function startGame() {
    if (!topic) return
    const shuffled = shuffle(topic.cards)
    setCards(shuffled)
    setCurrentIndex(0)
    setScore(0)
    setResults([])
    setUserAnswer('')
    setSelectedChoice(null)
    setIsCorrect(null)
    setGameState('playing')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function submitAnswer(answer: string) {
    if (timerRef.current) clearInterval(timerRef.current)

    const card    = cards[currentIndex]
    const correct = answer.trim().toLowerCase() === card.answer.trim().toLowerCase()

    setIsCorrect(correct)
    if (correct) setScore(prev => prev + 1)
    setResults(prev => [...prev, { card, correct, userAnswer: answer }])
    setGameState('answer_reveal')
  }

  function nextCard() {
    const next = currentIndex + 1
    if (next >= cards.length) {
      // Game over
      const exp = calculateEXP(score + (isCorrect ? 0 : 0), cards.length, timerOn, timerSeconds)
      const finalScore = results.filter(r => r.correct).length + (isCorrect ? 1 : 0)
      const finalExp   = calculateEXP(finalScore, cards.length, timerOn, timerSeconds)
      setExpGained(finalExp)
      setGameState('results')
      saveScore(finalScore, finalExp)
    } else {
      setCurrentIndex(next)
      setUserAnswer('')
      setSelectedChoice(null)
      setIsCorrect(null)
      setGameState('playing')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function saveScore(finalScore: number, exp: number) {
    try {
      await fetch('/api/scores', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId:   params.id,
          points:    finalScore,
          expGained: exp,
          timeTaken: timerOn ? timerSeconds * cards.length : 0,
          mode:      'SOLO',
        }),
      })
    } catch { /* silent */ }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    </div>
  )

  if (!topic) return null

  const currentCard = cards[currentIndex]
  const progress    = cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── START SCREEN ── */}
        {gameState === 'start' && (
          <div className="animate-fade-in">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>

            <div className="card p-8 text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                  <Zap className="w-10 h-10 text-yellow-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{topic.title}</h1>
              <p className="text-gray-400 mb-6">
                There are{' '}
                <span className="text-white font-bold">{String(topic._count.cards).padStart(2, '0')}</span>
                {' '}sets of questions. Play to proceed.
              </p>

              {/* Timer toggle */}
              <div className="bg-gray-800 rounded-2xl p-4 mb-6 text-left">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-indigo-400" />
                    <span className="text-white text-sm font-medium">Timer</span>
                  </div>
                  <button
                    onClick={() => setTimerOn(!timerOn)}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${timerOn ? 'bg-indigo-600' : 'bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${timerOn ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {timerOn && (
                  <div className="animate-fade-in">
                    <p className="text-gray-400 text-xs mb-2">Seconds per card:</p>
                    <div className="flex gap-2">
                      {TIMER_OPTIONS.map(sec => (
                        <button
                          key={sec}
                          onClick={() => setTimerSeconds(sec)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                            timerSeconds === sec
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                              : 'border-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={startGame}
                disabled={topic._count.cards === 0}
                className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Play className="w-5 h-5" />
                Start Challenge
              </button>

              {topic._count.cards === 0 && (
                <p className="text-red-400 text-sm mt-2">Walang cards pa. Mag-add muna ng cards.</p>
              )}
            </div>
          </div>
        )}

        {/* ── PLAYING / ANSWER REVEAL ── */}
        {(gameState === 'playing' || gameState === 'answer_reveal') && currentCard && (
          <div className="animate-fade-in">
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <span className="text-green-400">{score} correct</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Timer bar */}
            {timerOn && gameState === 'playing' && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span className={`text-sm font-medium ${timeLeft <= 5 ? 'text-red-400' : 'text-gray-400'}`}>
                    {timeLeft}s
                  </span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${(timeLeft / timerSeconds) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Card */}
            <div className="card p-6 mb-4">
              {/* Difficulty + type */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  currentCard.difficulty === 1 ? 'bg-green-500/10 text-green-400' :
                  currentCard.difficulty === 2 ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {currentCard.difficulty === 1 ? 'Easy' : currentCard.difficulty === 2 ? 'Medium' : 'Hard'}
                </span>
                <span className="text-xs text-gray-600">
                  {currentCard.cardType === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Identification'}
                </span>
              </div>

              {/* Question */}
              <p className="text-white text-lg font-medium leading-relaxed mb-6">
                {currentCard.question}
              </p>

              {/* Answer area */}
              {gameState === 'playing' && (
                <>
                  {(currentCard.cardType === 'IDENTIFICATION' || !currentCard.cardType) ? (
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={userAnswer}
                        onChange={e => setUserAnswer(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && userAnswer.trim()) submitAnswer(userAnswer) }}
                        placeholder="Type your answer..."
                        className="input flex-1"
                        autoFocus
                      />
                      <button
                        onClick={() => submitAnswer(userAnswer)}
                        disabled={!userAnswer.trim()}
                        className="btn-primary px-4 disabled:opacity-50"
                      >
                        Submit
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {shuffle(currentCard.choices).map((choice, i) => (
                        <button
                          key={i}
                          onClick={() => { setSelectedChoice(choice); submitAnswer(choice) }}
                          className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-indigo-500/50 rounded-xl text-white text-sm transition-all"
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Answer reveal */}
              {gameState === 'answer_reveal' && (
                <div className={`rounded-xl p-4 ${isCorrect ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isCorrect
                      ? <CheckCircle className="w-5 h-5 text-green-400" />
                      : <XCircle    className="w-5 h-5 text-red-400"   />
                    }
                    <span className={`font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {isCorrect ? 'Tama!' : 'Mali!'}
                    </span>
                  </div>
                  {!isCorrect && (
                    <p className="text-gray-300 text-sm">
                      Correct answer: <span className="text-white font-medium">{currentCard.answer}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Next button */}
            {gameState === 'answer_reveal' && (
              <button
                onClick={nextCard}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 animate-pop"
              >
                {currentIndex + 1 >= cards.length ? 'See Results' : 'Next Card'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ── RESULTS SCREEN ── */}
        {gameState === 'results' && (
          <div className="animate-fade-in">
            <div className="card p-8 text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className={`p-4 rounded-2xl border ${
                  score === cards.length
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : score >= cards.length / 2
                      ? 'bg-indigo-500/10 border-indigo-500/20'
                      : 'bg-gray-800 border-gray-700'
                }`}>
                  <Star className={`w-10 h-10 ${
                    score === cards.length ? 'text-yellow-400' :
                    score >= cards.length / 2 ? 'text-indigo-400' : 'text-gray-500'
                  }`} />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-1">
                {score === cards.length ? 'Perfect Score! 🎉' :
                 score >= cards.length / 2 ? 'Good job!' : 'Keep practicing!'}
              </h2>

              <p className="text-gray-400 mb-6">
                {score} out of {cards.length} correct
              </p>

              {/* Score breakdown */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-green-400 font-bold text-xl">{score}</p>
                  <p className="text-gray-500 text-xs">Correct</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-red-400 font-bold text-xl">{cards.length - score}</p>
                  <p className="text-gray-500 text-xs">Wrong</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-amber-400 font-bold text-xl">+{expGained}</p>
                  <p className="text-gray-500 text-xs">EXP</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Exit
                </button>
                <button
                  onClick={() => {
                    setGameState('start')
                    setScore(0)
                    setResults([])
                    setCurrentIndex(0)
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </button>
              </div>
            </div>

            {/* Results breakdown */}
            <h3 className="text-white font-semibold mb-3">Review</h3>
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className={`card p-4 border ${r.correct ? 'border-green-500/20' : 'border-red-500/20'}`}>
                  <div className="flex items-start gap-3">
                    {r.correct
                      ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      : <XCircle    className="w-4 h-4 text-red-400 shrink-0 mt-0.5"   />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm">{r.card.question}</p>
                      {!r.correct && (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-red-400 text-xs">Your answer: {r.userAnswer}</p>
                          <p className="text-green-400 text-xs">Correct: {r.card.answer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}