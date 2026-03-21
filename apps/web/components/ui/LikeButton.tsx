'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import toast from 'react-hot-toast'

interface LikeButtonProps {
  topicId:   string
  liked:     boolean
  likeCount: number
  onToggle?: (liked: boolean, likeCount: number) => void
}

export default function LikeButton({
  topicId, liked: initialLiked, likeCount: initialCount, onToggle,
}: LikeButtonProps) {
  const [liked,     setLiked]     = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialCount)
  const [loading,   setLoading]   = useState(false)

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation() // prevent card click
    if (loading) return
    setLoading(true)

    // Optimistic update
    const newLiked = !liked
    const newCount = newLiked ? likeCount + 1 : likeCount - 1
    setLiked(newLiked)
    setLikeCount(newCount)

    try {
      const res  = await fetch(`/api/topics/${topicId}/like`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setLiked(data.liked)
      setLikeCount(data.likeCount)
      onToggle?.(data.liked, data.likeCount)
    } catch (err: any) {
      // Revert on error
      setLiked(!newLiked)
      setLikeCount(likeCount)
      if (err.message === 'Unauthorized') {
        toast.error('Mag-login muna para mag-like')
      } else {
        toast.error('Hindi ma-like ang topic')
      }
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-all duration-200 active:scale-95
        ${liked
          ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
          : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
        }`}
    >
      <Heart
        className={`w-4 h-4 transition-all duration-200 ${liked ? 'fill-red-400 text-red-400' : ''} ${loading ? 'animate-pulse' : ''}`}
      />
      <span className={`font-medium tabular-nums ${liked ? 'text-red-400' : 'text-gray-500'}`}>
        {likeCount}
      </span>
    </button>
  )
}