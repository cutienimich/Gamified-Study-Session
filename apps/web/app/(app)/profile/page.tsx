'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  User, Pencil, Check, X, Loader2,
  Star, BookOpen, Trophy, GraduationCap, School,
  ArrowLeft,
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'

interface UserProfile {
  id:         string
  name:       string | null
  username:   string | null
  email:      string | null
  image:      string | null
  bio:        string | null
  exp:        number
  level:      number
  gradeLevel: string | null
  school:     string | null
  createdAt:  string
  _count:     { topics: number; scores: number }
}

const GRADE_LEVELS = [
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12',
  'College 1st Year', 'College 2nd Year',
  'College 3rd Year', 'College 4th Year',
  'Graduate Student', 'Other',
]

function EditableField({
  label, value, placeholder, onSave, multiline = false,
}: {
  label: string
  value: string
  placeholder: string
  onSave: (val: string) => Promise<void>
  multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [input,   setInput]   = useState(value)
  const [saving,  setSaving]  = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(input)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div>
      <label className="text-gray-500 text-xs mb-1 block">{label}</label>
      {editing ? (
        <div className="flex items-start gap-2">
          {multiline ? (
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="input flex-1 resize-none text-sm"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={placeholder}
              className="input flex-1 text-sm"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            />
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors shrink-0"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { setEditing(false); setInput(value) }}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-full text-left flex items-center justify-between group bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-3 transition-colors"
        >
          <span className={value ? 'text-white text-sm' : 'text-gray-600 text-sm'}>
            {value || placeholder}
          </span>
          <Pencil className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0 ml-2" />
        </button>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router  = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Grade level editing
  const [editingGrade, setEditingGrade] = useState(false)
  const [savingGrade,  setSavingGrade]  = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res  = await fetch('/api/profile')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setProfile(data.user)
      } catch (err: any) {
        toast.error(err.message || 'Failed to load profile')
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  async function updateField(field: string, value: string) {
    try {
      const res = await fetch('/api/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ [field]: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProfile(prev => prev ? { ...prev, ...data.user } : prev)
      toast.success('Updated!')
    } catch (err: any) {
      toast.error(err.message || 'Could not update :(')
      throw err
    }
  }

  async function handleGradeSave(gradeLevel: string) {
    setSavingGrade(true)
    try {
      await updateField('gradeLevel', gradeLevel)
      setEditingGrade(false)
    } catch { /* silent */ }
    setSavingGrade(false)
  }

  if (loading || !profile) return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    </div>
  )

  const nextLevelExp  = profile.level * 500
  const expPercent    = Math.min((profile.exp / nextLevelExp) * 100, 100)
  const memberSince   = new Date(profile.createdAt).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Back */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to dashboard
        </button>

        {/* Profile header card */}
        <div className="card p-6 mb-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={profile.name || ''}
                  width={80}
                  height={80}
                  className="rounded-2xl border-2 border-indigo-500/40"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
            </div>

            {/* Name + info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-xl truncate">
                {profile.name}
              </h1>
              {profile.username && (
                <p className="text-indigo-400 text-sm">@{profile.username}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">Member since {memberSince}</p>

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{profile._count.topics} topics</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{profile._count.scores} games</span>
                </div>
              </div>
            </div>

            {/* Level badge */}
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 shrink-0">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-bold text-sm">Level {profile.level}</span>
            </div>
          </div>

          {/* EXP Bar */}
          <div className="mt-5 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{profile.exp.toLocaleString()} EXP</span>
              <span>{nextLevelExp.toLocaleString()} EXP</span>
            </div>
            <div className="exp-bar">
              <div className="exp-bar-fill" style={{ width: `${expPercent}%` }} />
            </div>
            <p className="text-xs text-gray-600">
              {(nextLevelExp - profile.exp).toLocaleString()} EXP Level {profile.level + 1}
            </p>
          </div>
        </div>

        {/* Editable fields */}
        <div className="card p-6 space-y-4">
          <h2 className="text-white font-semibold text-lg mb-2">Edit Profile</h2>

          {/* Username */}
          <EditableField
            label="Username"
            value={profile.username || ''}
            placeholder="Set username..."
            onSave={val => updateField('username', val)}
          />

          {/* Bio */}
          <EditableField
            label="Bio"
            value={profile.bio || ''}
            placeholder="Your bio..."
            onSave={val => updateField('bio', val)}
            multiline
          />

          {/* Grade Level */}
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Grade Level</label>
            {editingGrade ? (
              <div className="grid grid-cols-2 gap-2">
                {GRADE_LEVELS.map(grade => (
                  <button
                    key={grade}
                    onClick={() => handleGradeSave(grade)}
                    disabled={savingGrade}
                    className={`py-2 px-3 rounded-lg text-sm text-left transition-all border ${
                      profile.gradeLevel === grade
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                        : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
                <button
                  onClick={() => setEditingGrade(false)}
                  className="col-span-2 py-2 px-3 rounded-lg text-sm text-gray-500 hover:text-white border border-gray-800 hover:border-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingGrade(true)}
                className="w-full text-left flex items-center justify-between group bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-3 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-gray-500" />
                  <span className={profile.gradeLevel ? 'text-white text-sm' : 'text-gray-600 text-sm'}>
                    {profile.gradeLevel || 'Piliin ang grade level...'}
                  </span>
                </div>
                <Pencil className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
              </button>
            )}
          </div>

          {/* School */}
          <EditableField
            label="School"
            value={profile.school || ''}
            placeholder="Type your school..."
            onSave={val => updateField('school', val)}
          />
        </div>

      </div>
    </div>
  )
}