import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'

// GET — get note for a topic
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const note = await prisma.note.findUnique({
      where: {
        userId_topicId: {
          userId:  (session.user as any).id,
          topicId: params.id,
        },
      },
    })

    return NextResponse.json({ content: note?.content || '' })
  } catch (err) {
    console.error('NOTE GET ERROR:', err)
    return NextResponse.json({ error: 'Failed to get note' }, { status: 500 })
  }
}

// POST — save/update note
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { content } = await req.json()
    const userId  = (session.user as any).id
    const topicId = params.id

    const note = await prisma.note.upsert({
      where:  { userId_topicId: { userId, topicId } },
      update: { content },
      create: { userId, topicId, content },
    })

    return NextResponse.json({ note })
  } catch (err) {
    console.error('NOTE SAVE ERROR:', err)
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }
}