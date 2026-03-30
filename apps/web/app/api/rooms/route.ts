import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { topicId } = await req.json()
    const userId      = (session.user as any).id

    // Generate unique room code
    let code: string
    let exists = true
    do {
      code  = generateRoomCode()
      const existing = await prisma.room.findUnique({ where: { code } })
      exists = !!existing
    } while (exists)

    const room = await prisma.room.create({
      data: {
        code,
        mode:    'MULTIPLAYER',
        topicId,
        hostId:  userId,
        participants: {
          create: { userId, score: 0 },
        },
      },
    })

    return NextResponse.json({ room })
  } catch (err: any) {
    console.error('ROOM CREATE ERROR:', err?.message)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}