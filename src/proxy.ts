import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const onLogin = req.nextUrl.pathname.startsWith('/login')

  if (!isLoggedIn && !onLogin) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }
  if (isLoggedIn && onLogin) {
    return Response.redirect(new URL('/', req.nextUrl))
  }
})

export const config = {
  // Run on everything except Next internals, the auth API, and static assets.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
