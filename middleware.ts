import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    console.log(`🔍 ROOT MIDDLEWARE: Processing ${pathname}`)

    // Skip API routes and static assets
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
        console.log(`⏭️ Skipping: ${pathname}`)
        return NextResponse.next()
    }

    console.log(`🍪 COOKIES: ${req.headers.get('cookie')}`)

    // Get token
    let token = null;
    try {
        console.log(`🔄 Getting token...`)
        token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development"
        })
        console.log(`✅ Got token successfully`)
    } catch (error) {
        console.error(`❌ Error getting token:`, error)
    }

    console.log(`🔐 TOKEN EXISTS: ${!!token}`)
    if (token) {
        console.log(`👤 User: ${token.email}`)
    }

    // If user is on signin page but already authenticated, redirect to home
    if ((pathname === '/auth/signin' || pathname === '/login') && token) {
        console.log(`🏠 User already authenticated, redirecting to home`)
        const homeUrl = new URL("/", req.url)
        return NextResponse.redirect(homeUrl)
    }

    // Allow signin page for unauthenticated users
    if (pathname === '/auth/signin' || pathname === '/login') {
        console.log(`✅ Allowing auth page: ${pathname}`)
        return NextResponse.next()
    }

    // For all other routes, require authentication
    if (!token) {
        console.log(`🔒 Redirecting to signin: ${pathname}`)
        const signInUrl = new URL("/auth/signin", req.url)
        return NextResponse.redirect(signInUrl)
    }

    // User is authenticated and accessing protected route
    console.log(`✅ Authenticated access to ${pathname}`)
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}