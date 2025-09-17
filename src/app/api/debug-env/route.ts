import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  // Only allow in development or with a specific debug token
  if (process.env.NODE_ENV === 'production' && process.env.DEBUG_TOKEN !== 'debug-hanoi-plan') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  try {
    // Test database connection
    let dbStatus = 'disconnected'
    try {
      if (prisma) {
        await prisma.$connect()
        dbStatus = 'connected'
      } else {
        dbStatus = 'prisma is null'
      }
    } catch (error) {
      console.error('DB connection error:', error)
      dbStatus = 'error: ' + (error as Error).message
    }

    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      dbStatus,
      prismaInstance: prisma ? 'EXISTS' : 'NULL',
    }

    return NextResponse.json(envCheck)
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      message: (error as Error).message 
    }, { status: 500 })
  }
}
