import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    console.log(`🔍 Simple Middleware: Processing ${pathname}`)

    // Skip API routes
    if (pathname.startsWith('/api/')) {
        console.log(`⏭️ Skipping API route: ${pathname}`)
        return NextResponse.next()
    }

    // Skip static assets
    if (pathname.startsWith('/_next/') || (pathname.includes('.') && pathname !== '/')) {
        console.log(`⏭️ Skipping static asset: ${pathname}`)
        return NextResponse.next()
    }

    console.log(`🍪 Request cookies:`, req.headers.get('cookie'))

    // Check authentication
    let token = null;
    try {
        console.log(`🔍 About to get token for ${pathname}...`)

        token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
            cookieName: process.env.NODE_ENV === "production"
                ? "__Secure-next-auth.session-token"
                : "next-auth.session-token"
        })

        console.log(`✅ Got token successfully for ${pathname}`)
    } catch (tokenError) {
        console.error(`🚨 Error getting token for ${pathname}:`, tokenError)
    }

    console.log(`🔐 Token for ${pathname}:`, token ? {
        email: token.email,
        name: token.name,
        sub: token.sub
    } : null)

    try {

        // If user is on signin page but already authenticated, redirect to home
        if ((pathname === '/auth/signin' || pathname === '/login') && token) {
            console.log(`🏠 User already authenticated, redirecting to home`)
            const homeUrl = new URL("/", req.url)
            return NextResponse.redirect(homeUrl)
        }

        // Allow signin page for unauthenticated users
        if (pathname === '/auth/signin' || pathname === '/login') {
            console.log(`✅ Allowing signin page for unauthenticated user`)
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
    } catch (error) {
        console.error('🚨 Middleware error:', error)
        // On error, redirect to signin for safety
        const signInUrl = new URL("/auth/signin", req.url)
        return NextResponse.redirect(signInUrl)
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}