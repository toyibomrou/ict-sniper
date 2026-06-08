import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Create user in PostgreSQL
    const licenseKey = generateLicenseKey()
    const user = await db.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash: hashPassword(password),
        licenseKey,
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
      },
      token,
      deviceCount: deviceResult.deviceCount,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
