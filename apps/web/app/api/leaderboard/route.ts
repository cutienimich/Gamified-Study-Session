import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId  = (session?.user as any)?.id
  const { searchParams } = new URL(req.url)
  const type  = searchParams.get('type')  || 'exp'        // 'exp' | 'popularity'
  const scope = searchParams.get('scope') || 'global'     // 'global' | 'friends'

  try {
    let users: any[] = []

    if (type === 'exp') {
      // Ranked by EXP
      users = await prisma.user.findMany({
        orderBy: { exp: 'desc' },
        take:    50,
        select: {
          id:       true,
          name:     true,
          username: true,
          image:    true,
          exp:      true,
          level:    true,
          _count: { select: { scores: true, topics: true } },
        },
      })
    } else if (type === 'popularity') {
      // Ranked by total likes received on their topics
      const usersWithLikes = await prisma.user.findMany({
        take:   50,
        select: {
          id:       true,
          name:     true,
          username: true,
          image:    true,
          exp:      true,
          level:    true,
          topics: {
            select: {
              _count: { select: { likes: true } },
            },
          },
          _count: { select: { scores: true, topics: true } },
        },
      })

      // Calculate total likes per user and sort
      users = usersWithLikes
        .map(user => ({
          ...user,
          totalLikes: user.topics.reduce(
            (sum: number, topic: any) => sum + topic._count.likes, 0
          ),
          topics: undefined,
        }))
        .sort((a, b) => b.totalLikes - a.totalLikes)
        .slice(0, 50)
    }

    // Find current user's rank
    let currentUserRank = null
    if (userId) {
      const rank = users.findIndex(u => u.id === userId) + 1
      if (rank > 0) currentUserRank = rank
      else {
        // User not in top 50 — find their actual rank
        if (type === 'exp') {
          const count = await prisma.user.count({
            where: {
              exp: {
                gt: (await prisma.user.findUnique({
                  where:  { id: userId },
                  select: { exp: true },
                }))?.exp || 0,
              },
            },
          })
          currentUserRank = count + 1
        }
      }
    }

    return NextResponse.json({ users, currentUserRank })
  } catch (err) {
    console.error('LEADERBOARD ERROR:', err)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}