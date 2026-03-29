import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

// POST — toggle follow/unfollow
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const followerId  = (session.user as any).id
  const followingId = params.id

  if (followerId === followingId) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  try {
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    })

    if (existing) {
      await prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId } },
      })
    } else {
      await prisma.follow.create({
        data: { followerId, followingId },
      })
    }

    const followerCount = await prisma.follow.count({ where: { followingId } })

    return NextResponse.json({
      following:     !existing,
      followerCount,
    })
  } catch (err: any) {
    console.error('FOLLOW ERROR:', err?.message)
    return NextResponse.json({ error: 'Failed to toggle follow' }, { status: 500 })
  }
}