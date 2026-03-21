import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { topicId, points, expGained, timeTaken, mode } = await req.json()
    const userId = (session.user as any).id

    // Save score
    const score = await prisma.score.create({
      data: { userId, topicId, points, expGained, timeTaken, mode },
    })

    // Update user EXP and level
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user) {
      const newExp   = user.exp + expGained
      const newLevel = Math.floor(newExp / 500) + 1

      await prisma.user.update({
        where: { id: userId },
        data:  { exp: newExp, level: newLevel },
      })
    }

    return NextResponse.json({ score })
  } catch (err: any) {
    console.error('SCORE SAVE ERROR:', err?.message)
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
  }
}