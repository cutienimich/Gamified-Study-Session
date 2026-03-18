// ─── Socket Events ───────────────────────────────────────────────
export const SOCKET_EVENTS = {
  // Room lifecycle
  JOIN_ROOM:   'join-room',
  LEAVE_ROOM:  'leave-room',
  ROOM_UPDATE: 'room-update',
  GAME_START:  'game-start',
  GAME_END:    'game-end',

  // Gameplay
  CARD_SHOWN:    'card-shown',
  HAND_RAISE:    'hand-raise',
  HAND_RAISE_ACK:'hand-raise-ack',  // server confirms who got the lock
  ANSWER_SUBMIT: 'answer-submit',
  ANSWER_RESULT: 'answer-result',
  NEXT_CARD:     'next-card',

  // Social
  CHALLENGE_INVITE:  'challenge-invite',
  CHALLENGE_ACCEPT:  'challenge-accept',
  CHALLENGE_DECLINE: 'challenge-decline',
  PLAYER_JOINED:     'player-joined',
  PLAYER_LEFT:       'player-left',
} as const

// ─── Game Types ───────────────────────────────────────────────────
export interface FlashCard {
  id: string
  question: string
  answer: string
  hint?: string
  difficulty: number
  order: number
}

export interface Player {
  id: string
  name: string
  image?: string
  score: number
  exp: number
  level: number
  isHost: boolean
  isConnected: boolean
}

export interface GameRoom {
  id: string
  code: string
  status: 'waiting' | 'in_progress' | 'finished'
  topicId: string
  topicTitle: string
  hostId: string
  players: Player[]
  currentCardIndex: number
  totalCards: number
  lockedPlayerId?: string  // who has the hand-raise lock
}

export interface HandRaiseResult {
  winnerId: string
  winnerName: string
  cardIndex: number
}

export interface AnswerResult {
  correct: boolean
  playerId: string
  pointsAwarded: number
  correctAnswer: string
}

export interface GameResult {
  players: (Player & { expGained: number })[]
  winnerId: string
}

// ─── EXP System ──────────────────────────────────────────────────
export const EXP_CONFIG = {
  CORRECT_ANSWER:    100,
  SPEED_BONUS_MAX:   50,   // decreases as time passes
  FIRST_PLACE:       200,
  PERFECT_GAME:      300,
  DAILY_LOGIN:       20,

  levelThreshold: (level: number) => level * 500,
} as const

export function calculateExpGain(
  score: number,
  totalCards: number,
  timeTakenMs: number,
  isMultiplayer: boolean,
): number {
  const accuracy = score / totalCards
  const baseExp = Math.round(score * EXP_CONFIG.CORRECT_ANSWER * accuracy)
  const speedBonus = Math.max(0, EXP_CONFIG.SPEED_BONUS_MAX - Math.floor(timeTakenMs / 1000))
  const multiplier = isMultiplayer ? 1.5 : 1
  return Math.round((baseExp + speedBonus) * multiplier)
}
