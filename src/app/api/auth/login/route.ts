import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword, createSession, registerDevice, generateDeviceFingerprint } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, deviceFp, deviceName, os } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    // Register device
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const fingerprint = deviceFp || generateDeviceFingerprint(
      req.headers.get('user-agent') || '',
      ip
    )

    const deviceResult = await registerDevice(user.id, {
      fingerprint,
      name: deviceName,
      os,
      ip,
    })

    if (!deviceResult.success) {
      return NextResponse.json({ error: deviceResult.error }, { status: 403 })
    }

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
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
