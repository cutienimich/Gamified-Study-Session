import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

// GET — get current user profile
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where:  { id: (session.user as any).id },
      select: {
        id:         true,
        name:       true,
        username:   true,
        email:      true,
        image:      true,
        bio:        true,
        exp:        true,
        level:      true,
        gradeLevel: true,
        school:     true,
        createdAt:  true,
        _count: { select: { topics: true, scores: true } },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({ user })
  } catch (err) {
    console.error('PROFILE GET ERROR:', err)
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 })
  }
}

// PATCH — update user profile
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { username, bio, gradeLevel, school } = await req.json()
    const userId = (session.user as any).id

    // Check if username is taken
    if (username) {
      const existing = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      })
      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username   !== undefined && { username }),
        ...(bio        !== undefined && { bio }),
        ...(gradeLevel !== undefined && { gradeLevel }),
        ...(school     !== undefined && { school }),
      },
      select: {
        id:         true,
        name:       true,
        username:   true,
        image:      true,
        bio:        true,
        exp:        true,
        level:      true,
        gradeLevel: true,
        school:     true,
      },
    })

    return NextResponse.json({ user })
  } catch (err: any) {
    console.error('PROFILE UPDATE ERROR:', err?.message)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}