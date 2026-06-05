import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/auth'
import crypto from 'crypto'

// ─── In-memory user store (must match register route) ───
const users = new Map<string, { id: string; email: string; name: string; passwordHash: string; licenseKey: string }>()

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Try Prisma/SQLite first (works in dev/local)
    try {
      const { db } = await import('@/lib/db')
      const { verifyPassword, registerDevice, generateDeviceFingerprint } = await import('@/lib/auth')

      const user = await db.user.findUnique({ where: { email } })
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      if (!user.isActive) {
        return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
      }

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
    } catch (dbError) {
      // SQLite/Prisma not available (Vercel serverless) — use in-memory fallback
      console.log('DB not available, using in-memory fallback for login')

      const userRecord = users.get(email)
      if (!userRecord || userRecord.passwordHash !== hashPassword(password)) {
        return NextResponse.json({ error: 'Invalid email or password. Use Quick Demo Access instead.' }, { status: 401 })
      }

      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      const fingerprint = crypto.createHash('sha256')
        .update(`${req.headers.get('user-agent') || ''}|${ip}`)
        .digest('hex')
        .substring(0, 32)

      const token = createSession(userRecord.id, userRecord.email, fingerprint)

      return NextResponse.json({
        success: true,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
          licenseKey: userRecord.licenseKey,
        },
        token,
        deviceCount: 1,
      })
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
