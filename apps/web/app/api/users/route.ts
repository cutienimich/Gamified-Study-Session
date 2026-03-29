import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId  = (session?.user as any)?.id
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''

  if (!query.trim()) {
    return NextResponse.json({ users: [] })
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } }, // exclude self
          {
            OR: [
              { name:     { contains: query, mode: 'insensitive' } },
              { username: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id:         true,
        name:       true,
        username:   true,
        image:      true,
        level:      true,
        exp:        true,
        gradeLevel: true,
        school:     true,
        _count: { select: { topics: true, followers: true } },
        followers: userId ? { where: { followerId: userId } } : false,
      },
      take: 20,
    })

    const shaped = users.map(user => ({
      ...user,
      isFollowing: userId ? (user.followers as any[])?.length > 0 : false,
      followers:   undefined,
    }))

    return NextResponse.json({ users: shaped })
  } catch (err) {
    console.error('USERS SEARCH ERROR:', err)
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
  }
}