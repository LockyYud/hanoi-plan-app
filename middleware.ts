import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    console.log(`🔍 MIDDLEWARE: Processing ${pathname}`)

    // Skip API routes and static assets
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
        console.log(`⏭️ Skipping: ${pathname}`)
        return NextResponse.next()
    }

    // Public routes that don't require authentication
    const publicRoutes = [
        '/',              // Home page (landing page for unauthenticated users)
        '/auth/signin',   // Sign in page
        '/login',         // Login page
        '/public',        // Public page
        '/share',         // Share pages (will be checked in detail below)
        '/p',             // Public share links /p/[shareSlug]
    ]

    // Check if pathname starts with any public route
    const isPublicRoute = publicRoutes.some(route => {
        if (route === '/') {
            return pathname === '/'
        }
        return pathname.startsWith(route)
    })

    // Allow public routes without authentication
    if (isPublicRoute) {
        console.log(`✅ Public route, allowing access: ${pathname}`)
        return NextResponse.next()
    }

    // For protected routes, check authentication
    let token = null;
    try {
        console.log(`🔄 Getting token for protected route...`)
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

    // If no token for protected route, redirect to signin
    if (!token) {
        console.log(`🔒 Protected route requires auth, redirecting to signin: ${pathname}`)
        const signInUrl = new URL("/auth/signin", req.url)
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
    }

    // User is authenticated and accessing protected route
    console.log(`✅ Authenticated access to ${pathname}`)
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}