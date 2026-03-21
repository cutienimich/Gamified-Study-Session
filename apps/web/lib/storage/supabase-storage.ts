import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const BUCKET = 'studyquest-files'

export async function uploadFile(
  file: Buffer,
  fileName: string,
  mimeType: string,
  folder: 'topics' | 'avatars' = 'topics'
): Promise<string> {
  const filePath = `${folder}/${Date.now()}-${fileName}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      contentType: mimeType,
      upsert: false,
    })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath)

  return data.publicUrl
}

export async function deleteFile(fileUrl: string): Promise<void> {
  const url = new URL(fileUrl)
  const filePath = url.pathname.split(`/${BUCKET}/`)[1]
  if (!filePath) return

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath])

  if (error) throw new Error(`Delete failed: ${error.message}`)
}

export async function uploadAvatar(
  file: Buffer,
  userId: string,
  mimeType: string
): Promise<string> {
  const ext = mimeType.split('/')[1] || 'jpg'
  const filePath = `avatars/${userId}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      contentType: mimeType,
      upsert: true,
    })

  if (error) throw new Error(`Avatar upload failed: ${error.message}`)

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath)

  return data.publicUrl
}
