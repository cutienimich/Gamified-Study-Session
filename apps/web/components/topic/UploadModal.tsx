'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Upload, FileText, Loader2, CheckCircle, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface UploadModalProps {
  onClose: () => void
  onSuccess: () => void
}

const SUBJECTS = [
  'Mathematics', 'Science', 'Biology', 'Chemistry', 'Physics',
  'History', 'English', 'Filipino', 'Computer Science',
  'Social Studies', 'Economics', 'Other',
]

export default function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const router = useRouter()
  const [title,   setTitle]   = useState('')
  const [subject, setSubject] = useState('')
  const [file,    setFile]    = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [step,    setStep]    = useState<'form' | 'generating' | 'done'>('form')
  const [mounted, setMounted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const hasFile = !!file

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  function removeFile() {
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit() {
    if (!title.trim() || !subject) {
      toast.error('Punan ang title at subject')
      return
    }

    setLoading(true)
    if (hasFile) setStep('generating')

    try {
      const formData = new FormData()
      formData.append('title',   title.trim())
      formData.append('subject', subject)
      formData.append('isPublic', 'true')
      if (file) formData.append('file', file)

      const res  = await fetch('/api/topics', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create topic')

      setStep('done')

      if (hasFile) {
        toast.success(`${data.topic._count.cards} cards ang nagawa ng AI!`)
        setTimeout(() => {
          onSuccess()
          onClose()
          router.push(`/topic/${data.topic.id}`)
        }, 1500)
      } else {
        toast.success('Topic created! Pwede ka nang mag-add ng cards.')
        setTimeout(() => {
          onSuccess()
          onClose()
          router.push(`/topic/${data.topic.id}`)
        }, 1000)
      }
    } catch (err: any) {
      toast.error(err.message || 'May error na nangyari')
      setStep('form')
      setLoading(false)
    }
  }

  if (!mounted) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-pop">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <h2 className="text-white font-semibold text-lg">Gumawa ng Topic</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">

          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              <p className="text-white font-medium">Ginagawa ang flashcards...</p>
              <p className="text-gray-400 text-sm text-center">
                Bine-basain ng AI ang iyong file at gumagawa ng mga tanong. Sandali lang!
              </p>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
              <p className="text-white font-medium">
                {hasFile ? 'Na-generate na ang cards!' : 'Topic created!'}
              </p>
              <p className="text-gray-400 text-sm text-center">
                Ire-redirect ka sa topic page...
              </p>
            </div>
          )}

          {step === 'form' && (
            <>
              {/* Title */}
              <div>
                <label className="text-gray-400 text-sm mb-1.5 block">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Object Oriented Programming"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="input"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="text-gray-400 text-sm mb-1.5 block">Subject *</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="input"
                >
                  <option value="">Piliin ang subject...</option>
                  {SUBJECTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* File upload area */}
              <div>
                {file ? (
                  /* File selected state */
                  <div className="border-2 border-indigo-500/40 bg-indigo-500/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-indigo-400 min-w-0">
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-medium truncate">{file.name}</span>
                      </div>
                      <button
                        onClick={removeFile}
                        className="text-gray-500 hover:text-red-400 transition-colors ml-2 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-300 text-xs">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      AI will automatically create sets of cards for you
                    </div>
                  </div>
                ) : (
                  /* Empty / guide state */
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-xl p-6 text-center cursor-pointer transition-colors group"
                  >
                    <Upload className="w-8 h-8 text-gray-600 group-hover:text-gray-400 mx-auto mb-3 transition-colors" />

                    <p className="text-gray-300 text-sm font-medium mb-1">
                      Drop a file to let AI create cards for you
                    </p>
                    <p className="text-gray-600 text-xs mb-4">
                      .docx, .pdf, .txt
                    </p>

                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-gray-800" />
                      <span className="text-gray-600 text-xs">or</span>
                      <div className="flex-1 h-px bg-gray-800" />
                    </div>

                    <p className="text-gray-500 text-xs">
                      Create an empty topic to manually add cards
                    </p>
                  </div>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept=".docx,.pdf,.txt"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {step === 'form' && (
          <div className="flex gap-3 px-6 py-4 border-t border-gray-800 shrink-0">
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !title.trim() || !subject}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : hasFile
                  ? <Sparkles className="w-4 h-4" />
                  : null
              }
              {hasFile ? 'Upload & Generate Cards' : 'Create Topic'}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}