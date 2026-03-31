'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import {
  Users, Copy, Play, Hand, CheckCircle, XCircle,
  Loader2, Crown, Home, RotateCcw, ArrowLeft,
  Trophy, LogIn,
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'

interface Player {
  id:          string
  name:        string
  image?:      string
  score:       number
  isHost:      boolean
  isConnected: boolean
}

interface Card {
  id:         string
  question:   string
  answer:     string
  hint?:      string | null
  difficulty: number
  cardType:   'IDENTIFICATION' | 'MULTIPLE_CHOICE'
  choices:    string[]
}

interface Topic {
  id:     string
  title:  string
  cards:  Card[]
  _count: { cards: number }
}

type GamePhase = 'setup' | 'lobby' | 'playing' | 'answer_reveal' | 'results'
type SetupMode = 'choose' | 'create' | 'join'

const SOCKET_EVENTS = {
  JOIN_ROOM:      'join-room',
  LEAVE_ROOM:     'leave-room',
  ROOM_UPDATE:    'room-update',
  GAME_START:     'game-start',
  GAME_END:       'game-end',
  CARD_SHOWN:     'card-shown',
  HAND_RAISE:     'hand-raise',
  HAND_RAISE_ACK: 'hand-raise-ack',
  ANSWER_SUBMIT:  'answer-submit',
  ANSWER_RESULT:  'answer-result',
  PLAYER_JOINED:  'player-joined',
  PLAYER_LEFT:    'player-left',
}

export default function ChallengePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [topic,           setTopic]           = useState<Topic | null>(null)
  const [loading,         setLoading]         = useState(true)
  const [phase,           setPhase]           = useState<GamePhase>('setup')
  const [setupMode,       setSetupMode]       = useState<SetupMode>('choose')
  const [roomCode,        setRoomCode]        = useState('')
  const [joinCode,        setJoinCode]        = useState('')
  const [players,         setPlayers]         = useState<Player[]>([])
  const [currentCard,     setCurrentCard]     = useState<Card | null>(null)
  const [cardIndex,       setCardIndex]       = useState(0)
  const [totalCards,      setTotalCards]      = useState(0)
  const [lockedPlayer,    setLockedPlayer]    = useState<{ id: string; name: string } | null>(null)
  const [answerResult,    setAnswerResult]    = useState<{ correct: boolean; answer: string } | null>(null)
  const [isAnswering,     setIsAnswering]     = useState(false)
  const [userAnswer,      setUserAnswer]      = useState('')
  const [shuffledChoices, setShuffledChoices] = useState<string[]>([])
  const [gameResults,     setGameResults]     = useState<Player[]>([])
  const [creating,        setCreating]        = useState(false)
  const [joining,         setJoining]         = useState(false)
  const [amIHost,         setAmIHost]         = useState(false)

  const socketRef = useRef<Socket | null>(null)
  const userId    = (session?.user as any)?.id

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
        setTotalCards(data.topic._count.cards)
      } catch { router.back() }
      setLoading(false)
    }
    fetchTopic()
  }, [params.id])

  // Shuffle choices when card changes
  useEffect(() => {
    if (!currentCard || currentCard.cardType !== 'MULTIPLE_CHOICE') {
      setShuffledChoices([])
      return
    }
    setShuffledChoices([...currentCard.choices].sort(() => Math.random() - 0.5))
  }, [currentCard?.id])

  function connectSocket(code: string, isHost: boolean) {
    if (socketRef.current?.connected) return

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: {
        userId,
        userName:  session?.user?.name,
        userImage: session?.user?.image,
        token:     'token',
      },
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, code)
      setAmIHost(isHost)
      setPhase('lobby')
    })

    socket.on(SOCKET_EVENTS.ROOM_UPDATE, (room: any) => {
      setPlayers(room.players || [])
    })

    socket.on(SOCKET_EVENTS.PLAYER_JOINED, (player: Player) => {
      setPlayers(prev => prev.find(p => p.id === player.id) ? prev : [...prev, player])
      if (player.id !== userId) toast(`${player.name} joined!`, { icon: '👋' })
    })

    socket.on(SOCKET_EVENTS.PLAYER_LEFT, (leftUserId: string) => {
      setPlayers(prev => prev.filter(p => p.id !== leftUserId))
    })

    socket.on(SOCKET_EVENTS.GAME_START, (room: any) => {
      setPhase('playing')
      setPlayers(room.players || [])
    })

    socket.on(SOCKET_EVENTS.CARD_SHOWN, ({ cardIndex: ci, card }: any) => {
      if (!topic) return
      const c = topic.cards[ci] || card
      if (c) {
        setCurrentCard(c)
        setCardIndex(ci)
        setLockedPlayer(null)
        setAnswerResult(null)
        setIsAnswering(false)
        setUserAnswer('')
        setPhase('playing')
      }
    })

    socket.on(SOCKET_EVENTS.HAND_RAISE_ACK, ({ winnerId, winnerName }: any) => {
      setLockedPlayer({ id: winnerId, name: winnerName })
      setIsAnswering(winnerId === userId)
    })

    socket.on(SOCKET_EVENTS.ANSWER_RESULT, (result: any) => {
      setAnswerResult({ correct: result.correct, answer: result.correctAnswer })
      setPlayers(prev => prev.map(p =>
        p.id === result.playerId
          ? { ...p, score: p.score + (result.correct ? result.pointsAwarded : 0) }
          : p
      ))
      setPhase('answer_reveal')
      setIsAnswering(false)
    })

    socket.on(SOCKET_EVENTS.GAME_END, ({ players: finalPlayers }: any) => {
      setGameResults(finalPlayers)
      setPhase('results')
    })

    socket.on('error', (msg: string) => toast.error(msg))
    socketRef.current = socket
  }

  async function createRoom() {
    setCreating(true)
    try {
      const res  = await fetch('/api/rooms', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ topicId: params.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRoomCode(data.room.code)
      connectSocket(data.room.code, true)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create room')
    }
    setCreating(false)
  }

  async function joinRoom() {
    if (!joinCode.trim()) return
    setJoining(true)
    try {
      const code = joinCode.trim().toUpperCase()
      // Verify room exists
      const res  = await fetch(`/api/rooms/${code}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Room not found')
      setRoomCode(code)
      connectSocket(code, false)
    } catch (err: any) {
      toast.error(err.message || 'Room not found')
    }
    setJoining(false)
  }

  function copyRoomCode() {
    navigator.clipboard.writeText(roomCode)
    toast.success('Room code copied!')
  }

  function startGame() {
    if (!socketRef.current || !roomCode) return
    socketRef.current.emit(SOCKET_EVENTS.GAME_START, roomCode)
  }

  function handleBuzzer() {
    if (!socketRef.current || !roomCode || lockedPlayer) return
    socketRef.current.emit(SOCKET_EVENTS.HAND_RAISE, { roomCode, cardIndex })
  }

  function submitAnswer(answer: string) {
    if (!socketRef.current || !roomCode || !currentCard) return
    socketRef.current.emit(SOCKET_EVENTS.ANSWER_SUBMIT, {
      roomCode,
      cardIndex,
      answer,
      correctAnswer: currentCard.answer,
      timeTakenMs:   0,
    })
    setIsAnswering(false)
  }

  function leaveRoom() {
    if (socketRef.current && roomCode) {
      socketRef.current.emit(SOCKET_EVENTS.LEAVE_ROOM, roomCode)
      socketRef.current.disconnect()
      socketRef.current = null
    }
    router.back()
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

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── SETUP: CHOOSE MODE ── */}
        {phase === 'setup' && setupMode === 'choose' && (
          <div className="animate-fade-in">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>

            <div className="card p-8 text-center mb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                  <Users className="w-10 h-10 text-amber-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{topic.title}</h1>
              <p className="text-gray-400 mb-8">Challenge your friends in real-time!</p>

              <div className="space-y-3">
                <button
                  onClick={() => setSetupMode('create')}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  <Crown className="w-5 h-5" />
                  Create a Room
                </button>
                <button
                  onClick={() => setSetupMode('join')}
                  className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Join a Room
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SETUP: CREATE ROOM ── */}
        {phase === 'setup' && setupMode === 'create' && (
          <div className="animate-fade-in">
            <button onClick={() => setSetupMode('choose')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>

            <div className="card p-8 text-center">
              <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Create a Room</h2>
              <p className="text-gray-400 mb-6">
                You will be the host. Share the room code with friends to invite them.
              </p>
              {topic._count.cards === 0 ? (
                <p className="text-red-400 text-sm">Walang cards pa. Mag-add muna ng cards.</p>
              ) : (
                <button
                  onClick={createRoom}
                  disabled={creating}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
                  {creating ? 'Creating...' : 'Create Room'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── SETUP: JOIN ROOM ── */}
        {phase === 'setup' && setupMode === 'join' && (
          <div className="animate-fade-in">
            <button onClick={() => setSetupMode('choose')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </button>

            <div className="card p-8 text-center">
              <LogIn className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Join a Room</h2>
              <p className="text-gray-400 mb-6">Enter the 6-character room code from your friend.</p>

              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') joinRoom() }}
                placeholder="Enter room code..."
                maxLength={6}
                className="input text-center text-2xl font-mono tracking-widest mb-4 uppercase"
                autoFocus
              />

              <button
                onClick={joinRoom}
                disabled={joining || joinCode.length < 6}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                {joining ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </div>
        )}

        {/* ── LOBBY ── */}
        {phase === 'lobby' && (
          <div className="animate-fade-in">
            <div className="card p-6 mb-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-bold text-xl">Waiting Room</h2>
                <button onClick={leaveRoom} className="text-gray-500 hover:text-red-400 transition-colors text-sm">
                  Leave
                </button>
              </div>

              {/* Room code */}
              <div className="bg-gray-800 rounded-xl p-4 flex items-center justify-between mb-6">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Room Code — share this with friends</p>
                  <p className="text-white font-mono font-bold text-3xl tracking-widest">{roomCode}</p>
                </div>
                <button onClick={copyRoomCode} className="flex items-center gap-2 btn-secondary text-sm shrink-0">
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>

              {/* Players list */}
              <div className="mb-6">
                <p className="text-gray-500 text-sm mb-3">
                  {players.length} player{players.length !== 1 ? 's' : ''} in room
                </p>
                <div className="space-y-2">
                  {players.length === 0 ? (
                    <div className="text-center py-6 text-gray-600 text-sm border-2 border-dashed border-gray-800 rounded-xl">
                      Waiting for players to join...
                    </div>
                  ) : (
                    players.map(player => (
                      <div key={player.id} className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
                        {player.image ? (
                          <Image src={player.image} alt={player.name} width={32} height={32} className="rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{player.name[0]}</span>
                          </div>
                        )}
                        <span className="text-white text-sm flex-1">{player.name}</span>
                        {player.isHost && <Crown className="w-4 h-4 text-amber-400" />}
                        {player.id === userId && <span className="text-indigo-400 text-xs">(You)</span>}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Start/Wait */}
              {amIHost ? (
                <button
                  onClick={startGame}
                  disabled={players.length < 1}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start Game ({players.length} player{players.length !== 1 ? 's' : ''})
                </button>
              ) : (
                <div className="text-center py-4 bg-gray-800 rounded-xl">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Waiting for host to start the game...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PLAYING / ANSWER REVEAL ── */}
        {(phase === 'playing' || phase === 'answer_reveal') && currentCard && (
          <div className="animate-fade-in">
            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Card {cardIndex + 1} of {totalCards}</span>
                <span>{players.length} players</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${(cardIndex / totalCards) * 100}%` }}
                />
              </div>
            </div>

            {/* Scoreboard */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[...players].sort((a, b) => b.score - a.score).map(player => (
                <div key={player.id} className={`flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2 shrink-0 ${player.id === userId ? 'border border-indigo-500/40' : ''}`}>
                  {player.image ? (
                    <Image src={player.image} alt={player.name} width={24} height={24} className="rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-white text-xs">{player.name[0]}</span>
                    </div>
                  )}
                  <span className="text-white text-xs font-bold">{player.score}</span>
                </div>
              ))}
            </div>

            {/* Card */}
            <div className="card p-6 mb-4">
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

              <p className="text-white text-lg font-medium leading-relaxed mb-6">
                {currentCard.question}
              </p>

              {/* Buzzer */}
              {phase === 'playing' && !lockedPlayer && (
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-4">Tap the buzzer first to answer!</p>
                  <button
                    onClick={handleBuzzer}
                    className="w-36 h-36 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-90 transition-all duration-150 mx-auto flex flex-col items-center justify-center shadow-xl shadow-amber-500/30 text-white font-bold"
                  >
                    <Hand className="w-12 h-12 mb-1" />
                    <span className="text-sm">BUZZ!</span>
                  </button>
                </div>
              )}

              {/* Someone buzzed */}
              {phase === 'playing' && lockedPlayer && (
                <div className="text-center">
                  <p className={`font-semibold mb-4 ${lockedPlayer.id === userId ? 'text-amber-400' : 'text-gray-300'}`}>
                    {lockedPlayer.id === userId ? '🎯 You buzzed in! Answer now!' : `⚡ ${lockedPlayer.name} buzzed in!`}
                  </p>

                  {isAnswering && (
                    <div className="mt-2">
                      {currentCard.cardType === 'IDENTIFICATION' ? (
                        <div className="flex gap-2">
                          <input
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
                        <div className="space-y-2 text-left">
                          {shuffledChoices.map((choice, i) => (
                            <button
                              key={i}
                              onClick={() => submitAnswer(choice)}
                              className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-amber-500/50 rounded-xl text-white text-sm transition-all"
                            >
                              <span className="text-gray-500 mr-3">{String.fromCharCode(65 + i)}.</span>
                              {choice}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {!isAnswering && (
                    <p className="text-gray-500 text-sm">Waiting for their answer...</p>
                  )}
                </div>
              )}

              {/* Answer reveal */}
              {phase === 'answer_reveal' && answerResult && (
                <div className={`rounded-xl p-4 ${answerResult.correct ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {answerResult.correct
                      ? <CheckCircle className="w-5 h-5 text-green-400" />
                      : <XCircle    className="w-5 h-5 text-red-400"   />
                    }
                    <span className={`font-semibold ${answerResult.correct ? 'text-green-400' : 'text-red-400'}`}>
                      {answerResult.correct ? 'Tama! ✨' : 'Mali!'}
                    </span>
                  </div>
                  {!answerResult.correct && (
                    <p className="text-gray-300 text-sm">
                      Correct answer: <span className="text-white font-medium">{answerResult.answer}</span>
                    </p>
                  )}
                  {amIHost && <p className="text-gray-600 text-xs mt-2">Next card loading...</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {phase === 'results' && (
          <div className="animate-fade-in">
            <div className="card p-8 text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                  <Trophy className="w-10 h-10 text-yellow-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-6">Game Over!</h2>

              <div className="space-y-3 mb-6">
                {[...gameResults].sort((a, b) => b.score - a.score).map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      index === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' :
                      player.id === userId ? 'bg-indigo-500/10 border border-indigo-500/20' :
                      'bg-gray-800'
                    }`}
                  >
                    <span className={`font-bold w-8 text-center ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-amber-500' : 'text-gray-500'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    {player.image ? (
                      <Image src={player.image} alt={player.name} width={32} height={32} className="rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{player.name[0]}</span>
                      </div>
                    )}
                    <span className="text-white text-sm flex-1 text-left">
                      {player.name}
                      {player.id === userId && <span className="text-indigo-400 text-xs ml-1">(You)</span>}
                    </span>
                    <span className="text-amber-400 font-bold">{player.score} pts</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Exit
                </button>
                {amIHost && (
                  <button
                    onClick={() => {
                      setPhase('lobby')
                      setGameResults([])
                      setCurrentCard(null)
                      setCardIndex(0)
                      setLockedPlayer(null)
                      setAnswerResult(null)
                    }}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Play Again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}