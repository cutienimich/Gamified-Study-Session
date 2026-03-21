'use client'

import Link from 'next/link'
import { Gamepad2, BookOpen, Zap, Trophy, ArrowRight, GraduationCap, Brain, Pencil, FlaskConical, Calculator, Atom, Music, Globe, Microscope, BookMarked } from 'lucide-react'

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

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 overflow-hidden">

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

      {/* Radial glow in center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Hero */}
      <div className="relative text-center max-w-2xl animate-fade-in z-10">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <Gamepad2 className="w-14 h-14 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">
          Ano<span className="text-indigo-500">Tara?</span>
        </h1>
        <p className="text-gray-400 text-xl mb-8">
          A gamified learning platform where you can study with friends in real-time battles. Upload your notes, create flashcards, and challenge your friends to quizzes.
        </p>

        <Link
          href="../login"
          className="btn-primary text-lg px-8 py-3 inline-flex items-center gap-2 rounded-xl shadow-lg shadow-indigo-500/20"
        >
          Get Started <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Feature cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl w-full animate-fade-in">
        <div className="card text-center hover:border-indigo-500/50 transition-colors duration-300">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <BookOpen className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Upload & Learn</h3>
          <p className="text-gray-400 text-sm">
            Upload your notes, create flashcards, and study with AI-powered summaries.
          </p>
        </div>

        <div className="card text-center hover:border-yellow-500/50 transition-colors duration-300">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <Zap className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Solo Challenge</h3>
          <p className="text-gray-400 text-sm">
            Create custom quizzes from your notes and test your knowledge solo.
          </p>
        </div>

        <div className="card text-center hover:border-amber-500/50 transition-colors duration-300">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Battle Friends</h3>
          <p className="text-gray-400 text-sm">
            Invite your friends to real-time quiz battles and compete for the top spot.
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 text-gray-600 text-sm mt-16">
        AnoTara? © 2026 · Created by @cutienimich
      </p>

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