import mammoth from 'mammoth'

const LLAMA_API_KEY = process.env.LLAMA_CLOUD_API_KEY!
const LLAMA_API_URL = 'https://api.cloud.llamaindex.ai/api/parsing'

/**
 * Main extraction function — routes to correct extractor based on file type
 */
export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop()

  // DOCX — use mammoth locally (fast, no API needed)
  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  // TXT — just read the buffer
  if (ext === 'txt' || mimeType === 'text/plain') {
    return buffer.toString('utf-8')
  }

  // PDF, PPTX — use LlamaParse API
  if (ext === 'pdf' || ext === 'pptx' || ext === 'ppt') {
    return await extractWithLlamaParse(buffer, fileName, mimeType)
  }

  throw new Error(`Unsupported file type: .${ext}`)
}

/**
 * LlamaParse — handles PDF and PPTX
 * Docs: https://docs.cloud.llamaindex.ai/llamaparse/getting_started/api
 */
async function extractWithLlamaParse(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<string> {

  // Step 1 — Upload file
  const formData = new FormData()
  const blob = new Blob([buffer], { type: mimeType })
  formData.append('file', blob, fileName)
  formData.append('language', 'en')
  formData.append('parsing_instruction', 'Extract all text content. Include all paragraphs, bullet points, headings, and slide content.')

  const uploadRes = await fetch(`${LLAMA_API_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LLAMA_API_KEY}`,
    },
    body: formData,
  })

  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    throw new Error(`LlamaParse upload failed: ${err}`)
  }

  const { id: jobId } = await uploadRes.json()

  // Step 2 — Poll for completion
  let attempts = 0
  const maxAttempts = 30 // 30 x 2s = 60s max wait

  while (attempts < maxAttempts) {
    await sleep(2000)

    const statusRes = await fetch(`${LLAMA_API_URL}/job/${jobId}`, {
      headers: { 'Authorization': `Bearer ${LLAMA_API_KEY}` },
    })

    const status = await statusRes.json()

    if (status.status === 'SUCCESS') {
      // Step 3 — Get extracted text
      const textRes = await fetch(`${LLAMA_API_URL}/job/${jobId}/result/text`, {
        headers: { 'Authorization': `Bearer ${LLAMA_API_KEY}` },
      })
      const textData = await textRes.json()
      return textData.text || ''
    }

    if (status.status === 'ERROR') {
      throw new Error(`LlamaParse processing failed: ${status.error}`)
    }

    attempts++
  }

  throw new Error('LlamaParse timed out after 60 seconds')
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}