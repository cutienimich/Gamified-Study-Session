import { Server, Socket } from 'socket.io'
import { SOCKET_EVENTS, GameRoom, Player, EXP_CONFIG } from '../types'
import { getRoom, setRoom, acquireHandRaiseLock, releaseHandRaiseLock } from '../rooms/roomStore'

export function registerGameHandlers(io: Server, socket: Socket) {
  const { userId, userName } = socket.data

  // Host starts the game
  socket.on(SOCKET_EVENTS.GAME_START, async (roomCode: string) => {
    const room = await getRoom(roomCode)
    if (!room || room.hostId !== userId) return

    room.status = 'in_progress'
    room.currentCardIndex = 0
    await setRoom(roomCode, room)

    io.to(roomCode).emit(SOCKET_EVENTS.GAME_START, room)
    io.to(roomCode).emit(SOCKET_EVENTS.CARD_SHOWN, { cardIndex: 0 })
  })

  // Player taps hand-raise button
  socket.on(SOCKET_EVENTS.HAND_RAISE, async ({ roomCode, cardIndex }: { roomCode: string; cardIndex: number }) => {
    const won = await acquireHandRaiseLock(roomCode, cardIndex, userId)
    if (!won) return // someone else got it first

    // Broadcast to room who won the lock
    io.to(roomCode).emit(SOCKET_EVENTS.HAND_RAISE_ACK, {
      winnerId: userId,
      winnerName: userName,
      cardIndex,
    })
  })

  // Winner submits their answer
  socket.on(SOCKET_EVENTS.ANSWER_SUBMIT, async ({
    roomCode, cardIndex, answer, correctAnswer, timeTakenMs,
  }: {
    roomCode: string; cardIndex: number; answer: string
    correctAnswer: string; timeTakenMs: number
  }) => {
    const room = await getRoom(roomCode)
    if (!room) return

    const correct = answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
    const player = room.players.find(p => p.id === userId)

    if (correct && player) {
      const speedBonus = Math.max(0, EXP_CONFIG.SPEED_BONUS_MAX - Math.floor(timeTakenMs / 1000))
      player.score += EXP_CONFIG.CORRECT_ANSWER + speedBonus
    }

    await setRoom(roomCode, room)
    await releaseHandRaiseLock(roomCode, cardIndex)

    io.to(roomCode).emit(SOCKET_EVENTS.ANSWER_RESULT, {
      correct,
      playerId: userId,
      pointsAwarded: correct ? EXP_CONFIG.CORRECT_ANSWER : 0,
      correctAnswer,
    })

    // Move to next card (host controls this; here server auto-advances)
    if (correct || true) {
      const nextIndex = cardIndex + 1
      if (nextIndex >= room.totalCards) {
        room.status = 'finished'
        await setRoom(roomCode, room)
        io.to(roomCode).emit(SOCKET_EVENTS.GAME_END, { players: room.players })
      } else {
        room.currentCardIndex = nextIndex
        await setRoom(roomCode, room)
        setTimeout(() => {
          io.to(roomCode).emit(SOCKET_EVENTS.CARD_SHOWN, { cardIndex: nextIndex })
        }, 2000)
      }
    }
  })
}
