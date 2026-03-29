import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

// GET — get following list + their recent topics + suggestions
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    // People I follow
    const following = await prisma.follow.findMany({
      where:   { followerId: userId },
      include: {
        following: {
          select: {
            id:         true,
            name:       true,
            username:   true,
            image:      true,
            level:      true,
            gradeLevel: true,
            school:     true,
            _count: { select: { topics: true, followers: true } },
            topics: {
              where:   { isPublic: true },
              orderBy: { createdAt: 'desc' },
              take:    3,
              select: {
                id:        true,
                title:     true,
                subject:   true,
                createdAt: true,
                _count:    { select: { cards: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Suggestions — popular users not yet followed
    const followingIds = following.map(f => f.followingId)
    const suggestions  = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          { id: { notIn: followingIds } },
        ],
      },
      orderBy: { exp: 'desc' },
      take:    5,
      select: {
        id:         true,
        name:       true,
        username:   true,
        image:      true,
        level:      true,
        gradeLevel: true,
        _count: { select: { topics: true, followers: true } },
      },
    })

    return NextResponse.json({
      following: following.map(f => f.following),
      suggestions,
    })
  } catch (err) {
    console.error('FRIENDS GET ERROR:', err)
    return NextResponse.json({ error: 'Failed to fetch friends data' }, { status: 500 })
  }
}