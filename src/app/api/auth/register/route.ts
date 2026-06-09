import { NextRequest, NextResponse } from 'next/server'
import { createSession, registerDevice, generateLicenseKey, generateDeviceFingerprint } from '@/lib/auth'
import crypto from 'crypto'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Import db dynamically to catch connection errors
    const { db } = await import('@/lib/db')

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Check if this is the first user (make them admin)
    const userCount = await db.user.count()
    const role = userCount === 0 ? 'admin' : 'user'

    // Create user in PostgreSQL
    const licenseKey = generateLicenseKey()
    const user = await db.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash: hashPassword(password),
        licenseKey,
        role,
      },
    })

    // Register the device
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const fingerprint = generateDeviceFingerprint(
      req.headers.get('user-agent') || '',
      ip
    )

    const deviceResult = await registerDevice(user.id, {
      fingerprint,
      name: 'Web Browser',
      os: 'web',
      ip,
    })

    const token = createSession(user.id, user.email, fingerprint)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        licenseKey: user.licenseKey,
        role: user.role,
      },
      token,
      deviceCount: deviceResult.deviceCount,
    })
  } catch (error: any) {
    console.error('Registration error:', error?.message || error)
    console.error('Full error:', error?.stack || error)

    // Return more specific error for debugging
    const errorMessage = error?.message || 'Internal server error'

    if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('P1001')) {
      return NextResponse.json({
        error: 'Database connection failed. Please try again later.',
        details: 'DB_CONNECTION_ERROR'
      }, { status: 503 })
    }

    if (errorMessage.includes('unique') || errorMessage.includes('P2002')) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}
