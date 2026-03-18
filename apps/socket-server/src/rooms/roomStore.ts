import { GameRoom } from '@studyquest/shared'

// In production: use ioredis with Upstash
// For local dev: simple in-memory Map
const rooms = new Map<string, GameRoom>()

export async function getRoom(code: string): Promise<GameRoom | null> {
  return rooms.get(code) ?? null
}

export async function setRoom(code: string, room: GameRoom): Promise<void> {
  rooms.set(code, room)
}

export async function deleteRoom(code: string): Promise<void> {
  rooms.delete(code)
}

// Redis mutex for hand-raise: first SET NX wins
const locks = new Map<string, string>() // cardKey -> playerId

export async function acquireHandRaiseLock(
  roomCode: string,
  cardIndex: number,
  playerId: string,
): Promise<boolean> {
  const key = `${roomCode}:card:${cardIndex}`
  if (locks.has(key)) return false // already locked
  locks.set(key, playerId)
  setTimeout(() => locks.delete(key), 10_000) // auto-expire
  return true
}

export async function releaseHandRaiseLock(
  roomCode: string,
  cardIndex: number,
): Promise<void> {
  locks.delete(`${roomCode}:card:${cardIndex}`)
}
