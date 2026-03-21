import { NextAuthOptions } from 'next-auth'
import FacebookProvider from 'next-auth/providers/facebook'
import { prisma } from '@/lib/db/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    FacebookProvider({
      clientId:     process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: `https://www.facebook.com/v18.0/dialog/oauth?scope=public_profile`,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Upsert user sa database
        await prisma.user.upsert({
          where:  { email: user.email! },
          update: { name: user.name, image: user.image },
          create: {
            email:    user.email!,
            name:     user.name,
            image:    user.image,
            username: user.name?.replace(/\s+/g, '').toLowerCase(),
          },
        })
      } catch (err) {
        console.error('SignIn upsert error:', err)
      }
      return true
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        // Kuhanin ang actual DB user id
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! },
        })
        if (dbUser) {
          (session.user as any).id    = dbUser.id
          ;(session.user as any).exp  = dbUser.exp
          ;(session.user as any).level = dbUser.level
        }
      }
      return session
    },

    jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}