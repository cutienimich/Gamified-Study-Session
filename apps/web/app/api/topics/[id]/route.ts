import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const topic = await prisma.topic.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { id: true, name: true, image: true } },
        cards:  { orderBy: { order: 'asc' } },
        _count: { select: { cards: true } },
      },
    })

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    return NextResponse.json({ topic })
  } catch (err) {
    console.error('TOPIC GET ERROR:', err)
    return NextResponse.json({ error: 'Failed to fetch topic' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const topic = await prisma.topic.findUnique({ where: { id: params.id } })
    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    if (topic.authorId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, subject, isPublic } = await req.json()

    const updated = await prisma.topic.update({
      where: { id: params.id },
      data: {
        ...(title    !== undefined && { title }),
        ...(subject  !== undefined && { subject }),
        ...(isPublic !== undefined && { isPublic }),
      },
    })

    return NextResponse.json({ topic: updated })
  } catch (err: any) {
    console.error('TOPIC PATCH ERROR:', err?.message)
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const topic = await prisma.topic.findUnique({ where: { id: params.id } })
    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    if (topic.authorId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.topic.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('TOPIC DELETE ERROR:', err?.message)
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 })
  }
}