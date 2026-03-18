'use client'
import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

let socket: Socket | null = null

export function useSocket() {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!session?.user?.id || socket) return

    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: {
        userId:    session.user.id,
        userName:  session.user.name,
        userImage: session.user.image,
        token:     (session as any).accessToken,
      },
      transports: ['websocket'],
    })

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))

    return () => {
      socket?.disconnect()
      socket = null
    }
  }, [session])

  return { socket, isConnected }
}
