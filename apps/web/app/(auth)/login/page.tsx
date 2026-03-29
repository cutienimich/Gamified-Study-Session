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
    if (status === 'authenticated') router.push('/dashboard')
  }, [status, router])

  async function handleGoogleLogin() {
    setLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
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
              top:  `${y}%`,
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
            P<span className="text-indigo-500">A</span>L
          </h1>
          <p className="text-gray-400 mt-2">Login to continue</p>
        </div>

        {/* Login card */}
        <div className="card p-8">
          <h2 className="text-white font-semibold text-xl mb-2 text-center">
            Welcome back
          </h2>
          <p className="text-gray-400 text-sm text-center mb-8">
            Login using your Google account.
          </p>

          {/* Google login button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-60 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-200 active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Naglo-login...' : 'Mag-login gamit ang Google'}
          </button>

          <p className="text-gray-600 text-xs text-center mt-6">
            By logging in. You accept our terms and conditions. 
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center mt-6">
          <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
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