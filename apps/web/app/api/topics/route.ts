import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'
import { generateFlashCards } from '@/lib/ai/generateCards'
import mammoth from 'mammoth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file     = formData.get('file') as File
    const title    = formData.get('title') as string
    const subject  = formData.get('subject') as string

    if (!file || !title || !subject) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Extract text from uploaded file
    let extractedText = ''
    const buffer = Buffer.from(await file.arrayBuffer())

    if (file.name.endsWith('.docx') || file.name.endsWith('.pptx')) {
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else if (file.type === 'text/plain') {
      extractedText = buffer.toString('utf-8')
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Use .docx, .pptx, or .txt' }, { status: 400 })
    }

    if (extractedText.trim().length < 50) {
      return NextResponse.json({ error: 'File has too little text content' }, { status: 400 })
    }

    // TODO: Upload file to R2 and get fileUrl
    const fileUrl = '' // placeholder

    // Generate cards using Gemini
    const generatedCards = await generateFlashCards(extractedText, title)

    // Save topic + cards to DB
    const topic = await prisma.topic.create({
      data: {
        title,
        subject,
        fileUrl,
        fileType: file.type,
        authorId: session.user.id,
        cards: {
          create: generatedCards.map((card, i) => ({
            question:   card.question,
            answer:     card.answer,
            hint:       card.hint,
            difficulty: card.difficulty,
            order:      i,
          })),
        },
      },
      include: { cards: true },
    })

    return NextResponse.json({ topic })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search  = searchParams.get('q') || ''
  const subject = searchParams.get('subject') || ''

  const topics = await prisma.topic.findMany({
    where: {
      isPublic: true,
      ...(search  && { OR: [{ title: { contains: search, mode: 'insensitive' } }, { subject: { contains: search, mode: 'insensitive' } }] }),
      ...(subject && { subject: { equals: subject, mode: 'insensitive' } }),
    },
    include: {
      author: { select: { id: true, name: true, image: true, level: true } },
      _count: { select: { cards: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ topics })
}
