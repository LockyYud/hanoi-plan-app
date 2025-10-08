import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    console.log(`🔍 SIMPLE MIDDLEWARE: ${pathname}`)

    // Skip API routes and static assets
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
        console.log(`⏭️ Skipping: ${pathname}`)
        return NextResponse.next()
    }

    console.log(`🍪 COOKIES: ${req.headers.get('cookie')}`)

    // Get token with try-catch
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

    // If no token and not on signin page, redirect to signin
    if (!token && pathname !== '/auth/signin') {
        console.log(`🔒 REDIRECTING TO SIGNIN`)
        return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    // If has token and on signin page, redirect to home
    if (token && pathname === '/auth/signin') {
        console.log(`🏠 REDIRECTING TO HOME`)
        return NextResponse.redirect(new URL("/", req.url))
    }

    console.log(`✅ ALLOWING ACCESS`)
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}