'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Gamepad2, Search, LogOut, User, ChevronDown } from 'lucide-react'
import Image from 'next/image'

interface NavbarProps {
  onSearch?: (query: string) => void
}

export default function Navbar({ onSearch }: NavbarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (onSearch) onSearch(searchQuery)
  }

  const user = session?.user

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">

        {/* Logo */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 shrink-0"
        >
          <Gamepad2 className="w-7 h-7 text-indigo-400" />
          <span className="text-white font-bold text-xl hidden sm:block">
            Ano<span className="text-indigo-500">Tara?</span>
          </span>
        </button>

        {/* Search bar — takes most of the space */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Maghanap ng topic..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input pl-9 py-2 text-sm bg-gray-900 w-full"
            />
          </div>
        </form>

        {/* Avatar + dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-gray-800 rounded-xl px-2 py-1.5 transition-colors"
          >
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || 'User'}
                width={34}
                height={34}
                className="rounded-full border-2 border-indigo-500/40"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="text-white text-sm font-medium hidden sm:block max-w-[120px] truncate">
              {user?.name}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden animate-fade-in">
              <button
                onClick={() => { router.push('/profile'); setDropdownOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <div className="border-t border-gray-800" />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-800 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}