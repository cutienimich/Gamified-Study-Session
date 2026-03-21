import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      exp?: number
      level?: number
      fbId?: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    exp?: number
    level?: number
    fbId?: string
  }
}