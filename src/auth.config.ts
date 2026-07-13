import type { NextAuthConfig } from 'next-auth'
import type { Role } from '@/lib/enums'

// Edge-safe shared config (no DB, no bcrypt). Used by middleware and extended in auth.ts.
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const onLogin = nextUrl.pathname.startsWith('/login')
      if (onLogin) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
        return true
      }
      return isLoggedIn // false → redirect to signIn page
    },
    jwt({ token, user }) {
      if (user) token.role = (user as { role?: Role }).role
      return token
    },
    session({ session, token }) {
      if (session.user) {
        const u = session.user as { id?: string; role?: Role }
        u.role = token.role as Role
        u.id = token.sub // NextAuth sets token.sub to the user id from authorize()
      }
      return session
    },
  },
} satisfies NextAuthConfig
