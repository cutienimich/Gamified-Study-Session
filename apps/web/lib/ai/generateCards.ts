import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export interface GeneratedCard {
  question: string
  answer: string
  hint: string
  difficulty: 1 | 2 | 3
}

export async function generateFlashCards(
  extractedText: string,
  topicTitle: string,
): Promise<GeneratedCard[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
You are an expert study card creator. Based on the following content from "${topicTitle}", 
generate 10-15 high-quality flashcard questions and answers.

Rules:
- Questions should test understanding, not just memorization
- Answers should be concise (1-3 sentences max)
- Hints should give a nudge without giving away the answer
- Difficulty: 1=easy, 2=medium, 3=hard

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "question": "...",
    "answer": "...",
    "hint": "...",
    "difficulty": 1
  }
]

Content:
${extractedText.slice(0, 8000)}
`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  try {
    const cleaned = text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned) as GeneratedCard[]
  } catch {
    throw new Error('Gemini returned invalid JSON')
  }
}
