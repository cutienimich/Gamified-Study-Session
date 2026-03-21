'use client'

import { BookOpen, MoreVertical, Trash2, Globe, Lock } from 'lucide-react'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import LikeButton from '@/components/ui/LikeButton'

interface TopicCardProps {
  topic: {
    id: string
    title: string
    subject: string
    isPublic: boolean
    createdAt: string
    author: { id: string; name: string | null; image: string | null }
    _count: { cards: number }
    likeCount?: number
    liked?: boolean
  }
  isOwner?: boolean
  onDelete?: (id: string) => void
  onClick?: () => void
}

const SUBJECT_COLORS: Record<string, string> = {
  'Mathematics':      'text-blue-400 bg-blue-500/10',
  'Science':          'text-green-400 bg-green-500/10',
  'Biology':          'text-emerald-400 bg-emerald-500/10',
  'Chemistry':        'text-purple-400 bg-purple-500/10',
  'Physics':          'text-yellow-400 bg-yellow-500/10',
  'History':          'text-amber-400 bg-amber-500/10',
  'English':          'text-pink-400 bg-pink-500/10',
  'Filipino':         'text-red-400 bg-red-500/10',
  'Computer Science': 'text-indigo-400 bg-indigo-500/10',
  'Other':            'text-gray-400 bg-gray-500/10',
}

export default function TopicCard({ topic, isOwner, onDelete, onClick }: TopicCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const subjectColor = SUBJECT_COLORS[topic.subject] || SUBJECT_COLORS['Other']

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleDelete() {
    if (!confirm('Sure ka bang i-delete ang topic na ito?')) return
    try {
      const res = await fetch(`/api/topics/${topic.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Na-delete na ang topic')
      onDelete?.(topic.id)
    } catch {
      toast.error('Hindi ma-delete ang topic')
    }
    setMenuOpen(false)
  }

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer hover:border-indigo-500/50 hover:bg-gray-800/50 transition-all duration-200 group relative flex flex-col"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${subjectColor}`}>
          {topic.subject}
        </span>

        <div className="flex items-center gap-1">
          {topic.isPublic
            ? <Globe className="w-3.5 h-3.5 text-gray-600" />
            : <Lock  className="w-3.5 h-3.5 text-gray-600" />
          }

          {isOwner && (
            <div className="relative" ref={menuRef} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-lg text-gray-600 hover:text-white hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-10">
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-red-400 hover:bg-gray-700 text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    I-delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-white font-semibold text-base mb-3 line-clamp-2 group-hover:text-indigo-300 transition-colors flex-1">
        {topic.title}
      </h3>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{topic._count.cards} cards</span>
          </div>
          {!isOwner && topic.author.image && (
            <div className="flex items-center gap-1.5">
              <Image
                src={topic.author.image}
                alt={topic.author.name || ''}
                width={18}
                height={18}
                className="rounded-full"
              />
              <span className="text-gray-600 text-xs truncate max-w-[80px]">
                {topic.author.name}
              </span>
            </div>
          )}
        </div>

        {/* Like button */}
        <LikeButton
          topicId={topic.id}
          liked={topic.liked || false}
          likeCount={topic.likeCount || 0}
        />
      </div>
    </div>
  )
}