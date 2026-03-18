import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { registerRoomHandlers } from './rooms/roomHandlers'
import { registerGameHandlers } from './events/gameHandlers'
import { authMiddleware } from './middleware/auth'

dotenv.config()

const app = express()
app.use(cors({ origin: process.env.CLIENT_URL }))
app.get('/health', (_, res) => res.json({ status: 'ok' }))

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] },
})

// Verify JWT before allowing socket connection
io.use(authMiddleware)

io.on('connection', (socket) => {
  console.log(`✅ Connected: ${socket.data.userId}`)

  registerRoomHandlers(io, socket)
  registerGameHandlers(io, socket)

  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.data.userId}`)
  })
})

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket server running on port ${PORT}`)
})
