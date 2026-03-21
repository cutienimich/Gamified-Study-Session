'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Globe, BookOpen, Users, Trophy, Loader2, Plus, Star, ChevronDown } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import TopicCard from '@/components/topic/TopicCard'
import UploadModal from '@/components/topic/UploadModal'

type Tab = 'public' | 'my-topics' | 'friends' | 'leaderboard'
type Sort = 'recent' | 'popular'

const TABS = [
  { id: 'public',      label: 'Public',      icon: Globe    },
  { id: 'my-topics',   label: 'My Topics',   icon: BookOpen },
  { id: 'friends',     label: 'Friends',     icon: Users    },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy   },
] as const

const SUBJECTS = [
  'All',
  'Mathematics', 'Science', 'Biology', 'Chemistry', 'Physics',
  'History', 'English', 'Filipino', 'Computer Science',
  'Social Studies', 'Economics', 'Other',
]

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'recent',  label: 'Recent'     },
  { value: 'popular', label: 'Popular'    },
]

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab,    setActiveTab]    = useState<Tab>('public')
  const [searchQuery,  setSearchQuery]  = useState('')
  const [publicTopics, setPublicTopics] = useState<any[] | null>(null)
  const [myTopics,     setMyTopics]     = useState<any[] | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar onSearch={setSearchQuery} />

      {/* Tabs */}
      <div className="border-b border-gray-800 bg-gray-950 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center w-full">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as Tab)}
                className={`flex items-center justify-center gap-2 flex-1 py-4 text-sm font-medium transition-all duration-200 border-b-2 -mb-px
                  ${activeTab === id
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      {activeTab === 'public' && (
          <PublicTab
            searchQuery={searchQuery}
            topics={publicTopics}
            setTopics={setPublicTopics}
            onTopicClick={id => router.push(`/topic/${id}`)}
          />
      )}
      {activeTab === 'my-topics' && (
        <MyTopicsTab
          session={session}
          searchQuery={searchQuery}
          topics={myTopics}
          setTopics={setMyTopics}
          onTopicClick={id => router.push(`/topic/${id}`)}
        />
      )}
        {activeTab === 'friends'     && <FriendsTab     />}
        {activeTab === 'leaderboard' && <LeaderboardTab />}
      </div>
    </div>
  )
}

// ── Public Tab ──────────────────────────────────────────────────
function PublicTab({ searchQuery, onTopicClick }: { searchQuery: string; onTopicClick: (id: string) => void }) {
  const [topics,          setTopics]          = useState<any[] | null>(null)
  const [loading,         setLoading]         = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [sort,            setSort]            = useState<Sort>('recent')
  const [showSortMenu,    setShowSortMenu]    = useState(false)

  const fetchTopics = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: 'public',
        q:    searchQuery,
        sort,
        ...(selectedSubject !== 'All' && { subject: selectedSubject }),
      })
      const res  = await fetch(`/api/topics?${params}`)
      const data = await res.json()
      setTopics(data.topics || [])
    } catch { /* silent */ }
    setLoading(false)
  }, [searchQuery, sort, selectedSubject])

  useEffect(() => {
    // May cache na at walang active filter/search — huwag mag-refetch
    if (topics !== null && !searchQuery && selectedSubject === 'All' && sort === 'recent') return
    fetchTopics()
  }, [fetchTopics])
  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">

        {/* Subject pills */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {SUBJECTS.map(s => (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${
                selectedSubject === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            {SORT_OPTIONS.find(o => o.value === sort)?.label}
            <ChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-10 animate-fade-in">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setSort(opt.value); setShowSortMenu(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    sort === opt.value
                      ? 'text-indigo-400 bg-indigo-500/10'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Topics grid */}
      {(loading || topics === null) ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Globe className="w-12 h-12 text-gray-700 mb-4" />
          <p className="text-gray-500 text-lg font-medium">
            {selectedSubject !== 'All' ? `Walang ${selectedSubject} topics pa` : 'No published topics yet.'}
          </p>
          <p className="text-gray-600 text-sm mt-1">Upload and share with others on public!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {topics.map(topic => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onClick={() => onTopicClick(topic.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── My Topics Tab ───────────────────────────────────────────────
function MyTopicsTab({ session, searchQuery, onTopicClick }: { session: any; searchQuery: string; onTopicClick: (id: string) => void }) {
  const [topics,     setTopics]     = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showUpload, setShowUpload] = useState(false)

  const user         = session?.user
  const level        = (user as any)?.level || 1
  const exp          = (user as any)?.exp   || 0
  const nextLevelExp = level * 500
  const expPercent   = Math.min((exp / nextLevelExp) * 100, 100)

  const fetchTopics = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: 'mine', q: searchQuery })
      const res    = await fetch(`/api/topics?${params}`)
      const data   = await res.json()
      setTopics(data.topics || [])
    } catch { /* silent */ }
    setLoading(false)
  }, [searchQuery])

  useEffect(() => { fetchTopics() }, [fetchTopics])

  function handleDelete(id: string) {
    setTopics(prev => prev.filter(t => t.id !== id))
  }

  return (
    <>
      {/* Greeting + EXP card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-bold text-xl">
              Greetings, <span className="text-indigo-400">{user?.name?.split(' ')[0]}</span>!
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">Let's Learn Something new!</p>
          </div>
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-bold text-sm">Level {level}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{exp} EXP</span>
            <span>{nextLevelExp} EXP</span>
          </div>
          <div className="exp-bar">
            <div className="exp-bar-fill" style={{ width: `${expPercent}%` }} />
          </div>
          <p className="text-xs text-gray-600">{nextLevelExp - exp} Exp Level {level + 1}</p>
        </div>
      </div>

      {/* My Topics header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">My Topics</h3>
        <button
          onClick={() => setShowUpload(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Mag-upload
        </button>
      </div>

      {/* Topics grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-800 rounded-2xl">
          <BookOpen className="w-12 h-12 text-gray-700 mb-4" />
          <p className="text-gray-500 text-lg font-medium">No Topics yet.</p>
          <p className="text-gray-600 text-sm mt-1 mb-6">Upload your first topic to start sharing knowledge.</p>
          <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Mag-upload ng unang topic
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {topics.map(topic => (
            <TopicCard
              key={topic.id}
              topic={topic}
              isOwner
              onDelete={handleDelete}
              onClick={() => onTopicClick(topic.id)}
            />
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            fetchTopics()
            setShowUpload(false)
          }}
        />
      )}
    </>
  )
}

// ── Placeholder tabs ────────────────────────────────────────────
function FriendsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Users className="w-12 h-12 text-gray-700 mb-4" />
      <p className="text-gray-500 text-lg font-medium">Friends</p>
      <p className="text-gray-600 text-sm mt-1">Coming soon</p>
    </div>
  )
}

function LeaderboardTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Trophy className="w-12 h-12 text-gray-700 mb-4" />
      <p className="text-gray-500 text-lg font-medium">Leaderboard</p>
      <p className="text-gray-600 text-sm mt-1">Coming soon</p>
    </div>
  )
}