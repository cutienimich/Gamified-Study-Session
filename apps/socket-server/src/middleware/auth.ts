import { Socket } from 'socket.io'
import { NextFunction } from 'express'

export function authMiddleware(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('No token provided'))

  // In production: verify the JWT using NEXTAUTH_SECRET
  // For now we trust the userId passed from the client session
  // TODO: jwt.verify(token, process.env.NEXTAUTH_SECRET)
  const userId = socket.handshake.auth?.userId
  if (!userId) return next(new Error('No user id'))

  socket.data.userId = userId
  socket.data.userName = socket.handshake.auth?.userName
  socket.data.userImage = socket.handshake.auth?.userImage
  next()
}
