import NextAuth from "next-auth"
import createIntlMiddleware from 'next-intl/middleware';
import authConfig from "./auth.config"
import { DEFAULT_LOGIN_REDIRECT, apiAuthPrefix, authRoutes, bookRoute, publicRoutes, demoRoute } from "./routes"
import { NextResponse } from "next/server";

const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'hi'],
  defaultLocale: 'hi',
  localePrefix: 'as-needed'
});

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const ref = nextUrl.searchParams.get("ref")
  const cookieOptions = {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax" as const,
  }

  const rPathMatch = nextUrl.pathname.match(/^(\/(en|hi))?\/r\/([A-Z0-9]+)$/)
  if (rPathMatch) {
    const localePrefix = rPathMatch[1] || ''
    const code = rPathMatch[3]
    const registerUrl = new URL(`${localePrefix}/register?ref=${code}`, nextUrl)
    const response = NextResponse.redirect(registerUrl)
    response.cookies.set("affiliate_ref", code, cookieOptions)
    return response
  }

  const isApiRoute = nextUrl.pathname.startsWith('/api')
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
  const isBookRoute = nextUrl.pathname.startsWith(bookRoute)
  const isDemoRoute = nextUrl.pathname.includes(demoRoute)
  
  const pathnameWithoutLocale = nextUrl.pathname.replace(/^\/(en|hi)/, '') || '/'
  const isPublicRoute = publicRoutes.includes(pathnameWithoutLocale)
  const isEnPublicRoute = publicRoutes.includes(`/en/${pathnameWithoutLocale}`)
  const isAuthRoute = authRoutes.includes(pathnameWithoutLocale)

  let response

  if (isApiRoute || isApiAuthRoute) {
    response = NextResponse.next()
  } else if (isAuthRoute) {
    if (isLoggedIn) {
      response = NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
    } else {
      response = intlMiddleware(req)
    }
  } else if (!isLoggedIn && !isPublicRoute && !isEnPublicRoute && !isDemoRoute && !isBookRoute) {
    let callbackUrl = nextUrl.pathname
    if (nextUrl.search) {
      callbackUrl += nextUrl.search
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl)
    const localePrefix = nextUrl.pathname.startsWith('/en') ? '/en' : nextUrl.pathname.startsWith('/hi') ? '/hi' : ''
    let redirectUrl = `${localePrefix}/login?callbackUrl=${encodedCallbackUrl}`

    if (ref) {
      redirectUrl += `&ref=${encodeURIComponent(ref)}`
    }

    response = NextResponse.redirect(new URL(redirectUrl, nextUrl))
  } else {
    response = intlMiddleware(req)
  }

  if (ref && response) {
    response.cookies.set("affiliate_ref", ref, cookieOptions)
  }

  return response
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|uploads/).*)'
  ]
}