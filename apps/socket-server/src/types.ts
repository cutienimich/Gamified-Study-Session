export const SOCKET_EVENTS = {
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
  NEXT_CARD:      'next-card',
  CHALLENGE_INVITE:  'challenge-invite',
  CHALLENGE_ACCEPT:  'challenge-accept',
  CHALLENGE_DECLINE: 'challenge-decline',
  PLAYER_JOINED:  'player-joined',
  PLAYER_LEFT:    'player-left',
} as const

export const EXP_CONFIG = {
  CORRECT_ANSWER:  100,
  SPEED_BONUS_MAX: 50,
  FIRST_PLACE:     200,
  PERFECT_GAME:    300,
  DAILY_LOGIN:     20,
} as const

export interface Player {
  id:          string
  name:        string
  image?:      string
  score:       number
  exp:         number
  level:       number
  isHost:      boolean
  isConnected: boolean
}

export interface GameRoom {
  id:               string
  code:             string
  status:           'waiting' | 'in_progress' | 'finished'
  topicId:          string
  topicTitle:       string
  hostId:           string
  players:          Player[]
  currentCardIndex: number
  totalCards:       number
  lockedPlayerId?:  string
}