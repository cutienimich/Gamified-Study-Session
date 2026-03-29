import { Server, Socket } from 'socket.io'
import { SOCKET_EVENTS, GameRoom, Player, EXP_CONFIG } from '../types'
import { getRoom, setRoom, deleteRoom } from './roomStore'

export function registerRoomHandlers(io: Server, socket: Socket) {
  const { userId, userName, userImage } = socket.data

  // Join an existing room by code
  socket.on(SOCKET_EVENTS.JOIN_ROOM, async (roomCode: string) => {
    const room = await getRoom(roomCode)
    if (!room) return socket.emit('error', 'Room not found')
    if (room.status !== 'waiting') return socket.emit('error', 'Game already started')

    const player: Player = {
      id: userId,
      name: userName,
      image: userImage,
      score: 0,
      exp: 0,
      level: 1,
      isHost: room.hostId === userId,
      isConnected: true,
    }

    // Add player if not already in
    const exists = room.players.find(p => p.id === userId)
    if (!exists) room.players.push(player)

    await setRoom(roomCode, room)
    socket.join(roomCode)

    io.to(roomCode).emit(SOCKET_EVENTS.ROOM_UPDATE, room)
    socket.to(roomCode).emit(SOCKET_EVENTS.PLAYER_JOINED, player)
    console.log(`👤 ${userName} joined room ${roomCode}`)
  })

  socket.on(SOCKET_EVENTS.LEAVE_ROOM, async (roomCode: string) => {
    const room = await getRoom(roomCode)
    if (!room) return

    room.players = room.players.filter(p => p.id !== userId)
    if (room.players.length === 0) {
      await deleteRoom(roomCode)
    } else {
      if (room.hostId === userId && room.players.length > 0) {
        room.hostId = room.players[0].id
        room.players[0].isHost = true
      }
      await setRoom(roomCode, room)
    }

    socket.leave(roomCode)
    io.to(roomCode).emit(SOCKET_EVENTS.ROOM_UPDATE, room)
    io.to(roomCode).emit(SOCKET_EVENTS.PLAYER_LEFT, userId)
  })
}
