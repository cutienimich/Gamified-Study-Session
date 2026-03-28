'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Trophy, Star, BookOpen, Loader2, Heart, Users, Globe } from 'lucide-react'
import Image from 'next/image'

interface LeaderboardUser {
  id:          string
  name:        string | null
  username:    string | null
  image:       string | null
  exp:         number
  level:       number
  totalLikes?: number
  _count: { scores: number; topics: number }
}

type LeaderboardType  = 'exp' | 'popularity'
type LeaderboardScope = 'global' | 'friends'

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

const RANK_STYLE: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-gray-300',
  3: 'text-amber-500',
}

export default function LeaderboardTab() {
  const { data: session } = useSession()
  const [users,           setUsers]           = useState<LeaderboardUser[]>([])
  const [loading,         setLoading]         = useState(true)
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)
  const [type,            setType]            = useState<LeaderboardType>('exp')
  const [scope,           setScope]           = useState<LeaderboardScope>('global')

  const currentUserId = (session?.user as any)?.id

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/leaderboard?type=${type}&scope=${scope}`)
      const data = await res.json()
      setUsers(data.users || [])
      setCurrentUserRank(data.currentUserRank)
    } catch { /* silent */ }
    setLoading(false)
  }, [type, scope])

  useEffect(() => { fetchLeaderboard() }, [fetchLeaderboard])

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <h2 className="text-white font-bold text-2xl">Leaderboard</h2>
        <p className="text-gray-400 text-sm mt-1">Strive and learn!</p>
      </div>

      {/* Type tabs — EXP vs Popularity */}
      <div className="flex gap-2 mb-4 bg-gray-900 p-1 rounded-xl">
        <button
          onClick={() => setType('exp')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            type === 'exp'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Star className="w-4 h-4" />
          EXP Ranking
        </button>
        <button
          onClick={() => setType('popularity')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            type === 'popularity'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          Popularity
        </button>
      </div>

      {/* Scope tabs — Global vs Friends */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setScope('global')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            scope === 'global'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Global
        </button>
        <button
          onClick={() => setScope('friends')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            scope === 'friends'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Friends
          <span className="text-xs text-gray-600 ml-1">(soon)</span>
        </button>
      </div>

      {/* Friends coming soon message */}
      {scope === 'friends' && (
        <div className="card p-6 text-center mb-6 border-dashed">
          <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Friends leaderboard coming soon</p>
          <p className="text-gray-600 text-sm mt-1">I-implement muna ang Friends feature</p>
        </div>
      )}

      {scope === 'global' && (
        <>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Trophy className="w-12 h-12 text-gray-700 mb-4" />
              <p className="text-gray-500 text-lg font-medium">Walang data pa</p>
              <p className="text-gray-600 text-sm mt-1">
                {type === 'exp'
                  ? 'Mag-play ng Solo Challenge para makita dito'
                  : 'Mag-upload ng public topics para makita dito'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Current user rank banner */}
              {currentUserRank && currentUserRank > 3 && (
                <div className="card p-3 mb-4 border-indigo-500/30 bg-indigo-500/5 flex items-center gap-3">
                  <span className="text-indigo-400 font-bold w-10 text-center">#{currentUserRank}</span>
                  <p className="text-gray-300 text-sm">Your current rank</p>
                  <p className="text-gray-600 text-xs ml-auto">Keep going! 💪</p>
                </div>
              )}

              {/* Top 3 podium */}
              {users.length >= 3 && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[users[1], users[0], users[2]].map((user, podiumIndex) => {
                    if (!user) return <div key={podiumIndex} />
                    const rank          = podiumIndex === 1 ? 1 : podiumIndex === 0 ? 2 : 3
                    const isCurrentUser = user.id === currentUserId
                    const value         = type === 'exp' ? `${user.exp.toLocaleString()} EXP` : `${user.totalLikes || 0} likes`

                    return (
                      <div
                        key={user.id}
                        className={`card text-center p-4 transition-all ${
                          rank === 1 ? 'border-yellow-500/30 bg-yellow-500/5 scale-105' :
                          rank === 2 ? 'border-gray-400/20' :
                          'border-amber-600/20'
                        } ${isCurrentUser ? 'ring-2 ring-indigo-500' : ''}`}
                      >
                        <div className="text-2xl mb-2">{RANK_MEDAL[rank]}</div>
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || ''}
                            width={44}
                            height={44}
                            className="rounded-full mx-auto mb-2 border-2 border-gray-700"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-2">
                            <span className="text-white font-bold">{user.name?.[0]}</span>
                          </div>
                        )}
                        <p className="text-white text-xs font-semibold truncate">
                          {user.username || user.name?.split(' ')[0]}
                        </p>
                        <p className={`text-xs font-bold mt-1 ${RANK_STYLE[rank]}`}>
                          {value}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Full list */}
              <div className="space-y-2">
                {users.map((user, index) => {
                  const rank          = index + 1
                  const isCurrentUser = user.id === currentUserId
                  const value         = type === 'exp'
                    ? `${user.exp.toLocaleString()} EXP`
                    : `${user.totalLikes || 0} likes`

                  return (
                    <div
                      key={user.id}
                      className={`card p-4 flex items-center gap-4 transition-all ${
                        isCurrentUser
                          ? 'border-indigo-500/40 bg-indigo-500/5'
                          : 'hover:border-gray-600'
                      }`}
                    >
                      {/* Rank */}
                      <div className={`w-8 text-center font-bold text-sm shrink-0 ${RANK_STYLE[rank] || 'text-gray-500'}`}>
                        {rank <= 3 ? RANK_MEDAL[rank] : `#${rank}`}
                      </div>

                      {/* Avatar */}
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || ''}
                          width={36}
                          height={36}
                          className="rounded-full border border-gray-700 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                          <span className="text-white text-sm font-bold">{user.name?.[0]}</span>
                        </div>
                      )}

                      {/* Name + stats */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold text-sm truncate ${isCurrentUser ? 'text-indigo-300' : 'text-white'}`}>
                            {user.username || user.name}
                          </p>
                          {isCurrentUser && (
                            <span className="text-indigo-400 text-xs bg-indigo-500/10 px-1.5 py-0.5 rounded-full shrink-0">You</span>
                          )}
                          <span className="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                            Lv.{user.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-gray-500 text-xs flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> {user._count.topics} Topics
                          </span>
                        </div>
                      </div>

                      {/* Value */}
                      <div className="text-right shrink-0">
                        <p className={`font-bold text-sm ${
                          type === 'exp' ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {value}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}