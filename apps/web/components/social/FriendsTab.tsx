'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, UserPlus, UserMinus, Loader2,
  BookOpen, Users, Star, X, Sparkles,
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface UserCard {
  id:          string
  name:        string | null
  username:    string | null
  image:       string | null
  level:       number
  gradeLevel:  string | null
  school?:     string | null
  isFollowing?: boolean
  _count:      { topics: number; followers: number }
  topics?:     { id: string; title: string; subject: string; createdAt: string; _count: { cards: number } }[]
}

function FollowButton({
  userId, isFollowing: initialFollowing, onToggle,
}: {
  userId: string
  isFollowing: boolean
  onToggle: (following: boolean) => void
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading,   setLoading]   = useState(false)

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setLoading(true)
    const newFollowing = !following
    setFollowing(newFollowing)

    try {
      const res  = await fetch(`/api/users/${userId}/follow`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFollowing(data.following)
      onToggle(data.following)
    } catch (err: any) {
      setFollowing(!newFollowing)
      toast.error(err.message || 'May error na nangyari')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
        following
          ? 'bg-gray-700 hover:bg-red-500/20 hover:text-red-400 text-gray-300 border border-gray-600'
          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : following ? (
        <UserMinus className="w-3.5 h-3.5" />
      ) : (
        <UserPlus className="w-3.5 h-3.5" />
      )}
      {following ? 'Following' : 'Follow'}
    </button>
  )
}

function UserCardComponent({
  user, showTopics = false, onFollowToggle, onUserClick,
}: {
  user: UserCard
  showTopics?: boolean
  onFollowToggle: (userId: string, following: boolean) => void
  onUserClick: (userId: string) => void
}) {
  return (
    <div className="card p-4 hover:border-gray-600 transition-all">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <button onClick={() => onUserClick(user.id)} className="shrink-0">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || ''}
              width={44}
              height={44}
              className="rounded-xl border border-gray-700"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold">{user.name?.[0]}</span>
            </div>
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {user.username ? `@${user.username}` : user.name}
              </p>
              {user.username && (
                <p className="text-gray-500 text-xs truncate">{user.name}</p>
              )}
            </div>
            <FollowButton
              userId={user.id}
              isFollowing={user.isFollowing || false}
              onToggle={following => onFollowToggle(user.id, following)}
            />
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-amber-400 text-xs bg-amber-500/10 px-1.5 py-0.5 rounded-full">
              Lv.{user.level}
            </span>
            {user.gradeLevel && (
              <span className="text-gray-500 text-xs">{user.gradeLevel}</span>
            )}
            <span className="text-gray-600 text-xs flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> {user._count.topics} topics
            </span>
            <span className="text-gray-600 text-xs flex items-center gap-1">
              <Users className="w-3 h-3" /> {user._count.followers} followers
            </span>
          </div>

          {/* Recent topics */}
          {showTopics && user.topics && user.topics.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-gray-600 text-xs">Recent topics:</p>
              {user.topics.map(topic => (
                <div key={topic.id} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                  <BookOpen className="w-3 h-3 text-gray-500 shrink-0" />
                  <span className="text-gray-300 text-xs truncate">{topic.title}</span>
                  <span className="text-gray-600 text-xs shrink-0 ml-auto">{topic._count.cards} cards</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FriendsTab() {
  const router = useRouter()
  const [following,    setFollowing]    = useState<UserCard[]>([])
  const [suggestions,  setSuggestions]  = useState<UserCard[]>([])
  const [searchResults, setSearchResults] = useState<UserCard[]>([])
  const [loading,      setLoading]      = useState(true)
  const [searching,    setSearching]    = useState(false)
  const [searchQuery,  setSearchQuery]  = useState('')
  const searchTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    async function fetchFriends() {
      try {
        const res  = await fetch('/api/friends')
        const data = await res.json()
        setFollowing(data.following   || [])
        setSuggestions(data.suggestions || [])
      } catch { /* silent */ }
      setLoading(false)
    }
    fetchFriends()
  }, [])

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res  = await fetch(`/api/users?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setSearchResults(data.users || [])
    } catch { /* silent */ }
    setSearching(false)
  }, [])

  function onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setSearchQuery(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => handleSearch(val), 500)
  }

  function handleFollowToggle(userId: string, isFollowing: boolean) {
    if (!isFollowing) {
      setFollowing(prev => prev.filter(u => u.id !== userId))
    }
    setSearchResults(prev =>
      prev.map(u => u.id === userId ? { ...u, isFollowing } : u)
    )
    setSuggestions(prev =>
      prev.map(u => u.id === userId ? { ...u, isFollowing } : u)
    )
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  )

  const isSearching = searchQuery.trim().length > 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Maghanap ng users..."
          value={searchQuery}
          onChange={onSearchChange}
          className="input pl-9 py-3"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setSearchResults([]) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search results */}
      {isSearching && (
        <div>
          <h3 className="text-white font-semibold mb-3">
            {searching ? 'Naghahanap...' : `${searchResults.length} results`}
          </h3>
          {searching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Walang nahanap para sa "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map(user => (
                <UserCardComponent
                  key={user.id}
                  user={user}
                  onFollowToggle={handleFollowToggle}
                  onUserClick={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Following */}
      {!isSearching && (
        <>
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Following
              <span className="text-gray-500 text-sm font-normal">({following.length})</span>
            </h3>

            {following.length === 0 ? (
              <div className="card p-6 text-center border-dashed">
                <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Wala ka pang sinusundan</p>
                <p className="text-gray-600 text-sm mt-1">Mag-search ng users para mag-follow</p>
              </div>
            ) : (
              <div className="space-y-3">
                {following.map(user => (
                  <UserCardComponent
                    key={user.id}
                    user={{ ...user, isFollowing: true }}
                    showTopics
                    onFollowToggle={handleFollowToggle}
                    onUserClick={() => {}}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Suggested for you
              </h3>
              <div className="space-y-3">
                {suggestions.map(user => (
                  <UserCardComponent
                    key={user.id}
                    user={{ ...user, isFollowing: false }}
                    onFollowToggle={handleFollowToggle}
                    onUserClick={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}