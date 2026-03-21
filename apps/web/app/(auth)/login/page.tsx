'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Gamepad2, GraduationCap, Brain, Pencil, FlaskConical, Calculator, Atom, Music, Globe, Microscope, BookMarked, BookOpen, Zap, ArrowLeft, Loader2 } from 'lucide-react'

const FLOATING_ICONS = [
  { Icon: GraduationCap, x: 5,  y: 10, size: 28, duration: 6,  delay: 0   },
  { Icon: Brain,         x: 15, y: 70, size: 22, duration: 8,  delay: 1   },
  { Icon: Pencil,        x: 25, y: 30, size: 18, duration: 7,  delay: 2   },
  { Icon: FlaskConical,  x: 80, y: 15, size: 26, duration: 9,  delay: 0.5 },
  { Icon: Calculator,    x: 90, y: 60, size: 20, duration: 6,  delay: 1.5 },
  { Icon: Atom,          x: 70, y: 80, size: 30, duration: 10, delay: 3   },
  { Icon: Music,         x: 55, y: 5,  size: 20, duration: 7,  delay: 2.5 },
  { Icon: Globe,         x: 40, y: 85, size: 24, duration: 8,  delay: 0.8 },
  { Icon: Microscope,    x: 92, y: 35, size: 22, duration: 9,  delay: 4   },
  { Icon: BookMarked,    x: 8,  y: 50, size: 26, duration: 7,  delay: 1.2 },
  { Icon: BookOpen,      x: 60, y: 92, size: 18, duration: 6,  delay: 3.5 },
  { Icon: Brain,         x: 45, y: 50, size: 16, duration: 11, delay: 2   },
  { Icon: Zap,           x: 75, y: 45, size: 20, duration: 8,  delay: 0.3 },
  { Icon: GraduationCap, x: 30, y: 92, size: 22, duration: 9,  delay: 4.5 },
  { Icon: Atom,          x: 18, y: 18, size: 16, duration: 7,  delay: 1.8 },
]

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  async function handleFacebookLogin() {
    setLoading(true)
    await signIn('facebook', { callbackUrl: '/dashboard' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  return (
    <main className="relative min-h-screen bg-gray-950 flex items-center justify-center px-4 overflow-hidden">

      {/* Floating background icons */}
      <div className="absolute inset-0 pointer-events-none">
        {FLOATING_ICONS.map(({ Icon, x, y, size, duration, delay }, i) => (
          <div
            key={i}
            className="absolute opacity-[0.06]"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animation: `floatIcon ${duration}s ease-in-out ${delay}s infinite`,
            }}
          >
            <Icon style={{ width: size, height: size }} className="text-indigo-300" />
          </div>
        ))}
      </div>

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-pop">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <Gamepad2 className="w-12 h-12 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Ano<span className="text-indigo-500">Tara?</span>
          </h1>
          <p className="text-gray-400 mt-2">Mag-login para magsimula</p>
        </div>

        {/* Login card */}
        <div className="card p-8">
          <h2 className="text-white font-semibold text-xl mb-2 text-center">
            Welcome back
          </h2>
          <p className="text-gray-400 text-sm text-center mb-8">
            Gamitin ang iyong Facebook account para mag-login at mag-sync ng friends.
          </p>

          {/* Facebook login button */}
          <button
            onClick={handleFacebookLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
            {loading ? 'Naglo-login...' : 'Mag-login gamit ang Facebook'}
          </button>

          <p className="text-gray-600 text-xs text-center mt-6">
            Sa pag-login, sumasang-ayon ka sa aming Terms of Service at Privacy Policy.
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center mt-6">
          <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Bumalik sa home
          </a>
        </p>
      </div>

      {/* Float animation */}
      <style jsx>{`
        @keyframes floatIcon {
          0%   { transform: translateY(0px) rotate(0deg); }
          33%  { transform: translateY(-12px) rotate(5deg); }
          66%  { transform: translateY(-6px) rotate(-3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>
    </main>
  )
}