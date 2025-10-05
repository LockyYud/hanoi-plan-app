import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    console.log(`🔍 Simple Middleware: Processing ${pathname}`)

    // Skip API routes
    if (pathname.startsWith('/api/')) {
        return NextResponse.next()
    }

    // Allow signin page
    if (pathname === '/auth/signin' || pathname === '/login') {
        console.log(`✅ Allowing auth page: ${pathname}`)
        return NextResponse.next()
    }

    // For now, redirect all other routes to signin (for testing)
    if (pathname === '/') {
        console.log(`� Redirecting home to signin`)
        const signInUrl = new URL("/auth/signin", req.url)
        return NextResponse.redirect(signInUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}