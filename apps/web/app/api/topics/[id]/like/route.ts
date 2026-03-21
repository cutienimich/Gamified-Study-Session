import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

// POST — toggle like (like/unlike)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId  = (session.user as any).id
  const topicId = params.id

  try {
    // Check if already liked
    const existing = await prisma.like.findUnique({
      where: { userId_topicId: { userId, topicId } },
    })

    if (existing) {
      // Unlike
      await prisma.like.delete({
        where: { userId_topicId: { userId, topicId } },
      })
    } else {
      // Like
      await prisma.like.create({
        data: { userId, topicId },
      })
    }

    // Get updated like count
    const likeCount = await prisma.like.count({ where: { topicId } })

    return NextResponse.json({
      liked:     !existing,
      likeCount,
    })
  } catch (err: any) {
    console.error('LIKE ERROR:', err?.message)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}