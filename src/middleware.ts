import { NextRequest, NextResponse } from "next/server"import { NextRequest, NextResponse } from "next/server"

import { getToken } from "next-auth/jwt"

export function middleware(req: NextRequest) {

    export async function middleware(req: NextRequest) {
        const { pathname } = req.nextUrl

        const { pathname } = req.nextUrl

        console.log(`🔍 Simple Middleware: Processing ${pathname}`)

        console.log(`🔍 Middleware: Processing ${pathname}`)

        // Skip API routes

        // Skip API routes    if (pathname.startsWith('/api/')) {

        if (pathname.startsWith('/api/')) {
            return NextResponse.next()

            return NextResponse.next()
        }

    }

    // Allow signin page

    // Allow signin page and static assets    if (pathname === '/auth/signin' || pathname === '/login') {

    if (pathname === '/auth/signin' || console.log(`✅ Allowing auth page: ${pathname}`)

        pathname === '/login' ||         return NextResponse.next()

    pathname.startsWith('/_next/') ||    }

pathname.includes('.')) {

    console.log(`✅ Allowing: ${pathname}`)    // For now, redirect all other routes to signin (for testing)

    return NextResponse.next()    if (pathname === '/') {

    } console.log(`� Redirecting home to signin`)

    const signInUrl = new URL("/auth/signin", req.url)

    // Check authentication for all other routes        return NextResponse.redirect(signInUrl)

    try { }

        const token = await getToken({

        req, return NextResponse.next()

            secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development"
    }

        })

export const config = {

    console.log(`🔐 Token exists for ${pathname}:`, !!token)    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],

}
// If no token, redirect to signin
if (!token) {
    console.log(`🔒 Redirecting to signin: ${pathname}`)
    const signInUrl = new URL("/auth/signin", req.url)
    return NextResponse.redirect(signInUrl)
}

// User is authenticated
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