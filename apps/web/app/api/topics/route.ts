import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/db/prisma'
import {Like} from '@prisma/client'
import { generateFlashCards } from '@/lib/ai/generateCards'
import { extractTextFromFile } from '@/lib/ai/extractText'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(req.url)
  const type    = searchParams.get('type')    || 'public'
  const search  = searchParams.get('q')       || ''
  const subject = searchParams.get('subject') || ''
  const sort    = searchParams.get('sort')    || 'recent'
  const userId  = (session?.user as any)?.id

  try {
    const topics = await prisma.topic.findMany({
      where: {
        ...(type === 'mine'
          ? { authorId: userId }
          : { isPublic: true }
        ),
        ...(search && {
          OR: [
            { title:   { contains: search, mode: 'insensitive' } },
            { subject: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(subject && { subject: { equals: subject, mode: 'insensitive' } }),
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { cards: true } },
        like:   userId ? { where: { userId } } : false,
      },
      orderBy: sort === 'popular'
        ? { likes: { _count: 'desc' } }
        : { createdAt: 'desc' },
    })

  const shaped = topics.map(topic => ({
    ...topic,
    likeCount: (topic.likes as any[])?.length || 0,
    liked:     userId ? (topic.likes as any[])?.length > 0 : false,
    likes:     undefined,
  }))
  
    return NextResponse.json({ topics: shaped })
  } catch (err) {
    console.error('TOPICS GET ERROR:', err)
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file     = formData.get('file') as File | null
    const title    = formData.get('title') as string
    const subject  = formData.get('subject') as string
    const isPublic = formData.get('isPublic') === 'true'

    if (!title || !subject) {
      return NextResponse.json({ error: 'Title and subject are required' }, { status: 400 })
    }

    let generatedCards: any[] = []
    let fileUrl  = ''
    let fileType = ''

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer())
      fileType = file.type

      console.log(`Extracting text from: ${file.name}`)
      let extractedText = ''
      try {
        extractedText = await extractTextFromFile(buffer, file.name, file.type)
        console.log(`Extracted ${extractedText.length} characters`)
      } catch (extractErr: any) {
        return NextResponse.json(
          { error: `Failed to extract text: ${extractErr?.message}` },
          { status: 400 }
        )
      }

      if (extractedText.trim().length < 20) {
        return NextResponse.json(
          { error: 'Not enough text content to generate cards.' },
          { status: 400 }
        )
      }

      try {
        const { uploadFile } = await import('@/lib/storage/supabase-storage')
        fileUrl = await uploadFile(buffer, file.name, file.type, 'topics')
      } catch (uploadErr: any) {
        console.error('UPLOAD ERROR:', uploadErr?.message)
      }

      console.log('Generating flashcards with Gemini...')
      generatedCards = await generateFlashCards(extractedText, title)
      console.log(`Generated ${generatedCards.length} cards`)
    }

    const topic = await prisma.topic.create({
      data: {
        title,
        subject,
        fileUrl,
        fileType,
        isPublic,
        authorId: (session.user as any).id,
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
      include: {
        _count: { select: { cards: true } },
      },
    })

    return NextResponse.json({ topic })
  } catch (err: any) {
    console.error('TOPIC CREATE ERROR:', err?.message || err)
    return NextResponse.json(
      { error: err?.message || 'Failed to create topic' },
      { status: 500 }
    )
  }
}