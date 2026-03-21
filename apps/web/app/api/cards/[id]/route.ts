import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

async function verifyCardOwnership(cardId: string, userId: string) {
  const card = await prisma.card.findUnique({
    where:   { id: cardId },
    include: { topic: true },
  })
  if (!card) return null
  if (card.topic.authorId !== userId) return null
  return card
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
    const card = await verifyCardOwnership(params.id, (session.user as any).id)
    if (!card) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })

    const { question, answer, hint, difficulty, type, choices } = await req.json()

    const updated = await prisma.card.update({
      where: { id: params.id },
      data: {
        question,
        answer,
        hint:       hint || null,
        difficulty: difficulty || 1,
        type:       type || 'IDENTIFICATION',
        choices:    choices || [],
      },
    })

    return NextResponse.json({ card: updated })
  } catch (err: any) {
    console.error('CARD UPDATE ERROR:', err?.message)
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 })
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
    const card = await verifyCardOwnership(params.id, (session.user as any).id)
    if (!card) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 })

    await prisma.card.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('CARD DELETE ERROR:', err?.message)
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 })
  }
}