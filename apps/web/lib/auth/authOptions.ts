import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import FacebookProvider from 'next-auth/providers/facebook'
import { prisma } from '@/lib/db/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    FacebookProvider({
      clientId:     process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      // Request friends permission
      authorization: {
        params: { scope: 'email,public_profile,user_friends' },
      },
      profile(profile) {
        return {
          id:    profile.id,
          name:  profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
          fbId:  profile.id,
        }
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id    = user.id
        session.user.fbId  = (user as any).fbId
        session.user.exp   = (user as any).exp
        session.user.level = (user as any).level
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
