import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'
import { CardType } from '@prisma/client'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { topicId, question, answer, hint, difficulty, cardType, choices } = await req.json()

    const topic = await prisma.topic.findUnique({ where: { id: topicId } })
    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    if (topic.authorId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const lastCard = await prisma.card.findFirst({
      where:   { topicId },
      orderBy: { order: 'desc' },
    })

    const card = await prisma.card.create({
      data: {
        topicId,
        question,
        answer,
        hint:       hint || null,
        difficulty: difficulty || 1,
        cardType:   (cardType as CardType) || CardType.IDENTIFICATION,
        choices:    choices || [],
        order:      (lastCard?.order ?? -1) + 1,
      },
    })

    return NextResponse.json({ card })
  } catch (err: any) {
    console.error('CARD CREATE ERROR:', err?.message)
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 })
  }
}