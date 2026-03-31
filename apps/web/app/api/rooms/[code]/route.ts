import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const room = await prisma.room.findUnique({
      where: { code: params.code },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.status === 'FINISHED') {
      return NextResponse.json({ error: 'Game already ended' }, { status: 400 })
    }

    return NextResponse.json({ room })
  } catch (err) {
    console.error('ROOM LOOKUP ERROR:', err)
    return NextResponse.json({ error: 'Failed to find room' }, { status: 500 })
  }
}