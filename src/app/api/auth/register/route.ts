import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/auth'
import crypto from 'crypto'

// ─── In-memory user store (Vercel-safe fallback) ───
// On Vercel, SQLite is not available, so we use this in-memory store.
// Each serverless function invocation gets a fresh store, but the
// JWT-based session (stored in localStorage) persists across invocations.
const users = new Map<string, { id: string; email: string; name: string; passwordHash: string; licenseKey: string }>()

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

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 })
    }

    // Try Prisma/SQLite first (works in dev/local)
    try {
      const { db } = await import('@/lib/db')
      const { registerDevice, generateLicenseKey, generateDeviceFingerprint } = await import('@/lib/auth')

      const existing = await db.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }

      const licenseKey = generateLicenseKey()
      const user = await db.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          passwordHash: hashPassword(password),
          licenseKey,
        },
      })

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
    } catch (dbError) {
      // SQLite/Prisma not available (Vercel serverless) — use in-memory fallback
      console.log('DB not available, using in-memory fallback for registration')

      // Check if user already exists in memory
      if (users.has(email)) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }

      // Create user in memory
      const userId = `user_${crypto.randomBytes(8).toString('hex')}`
      const licenseKey = `${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

      const userRecord = {
        id: userId,
        email,
        name: name || email.split('@')[0],
        passwordHash: hashPassword(password),
        licenseKey,
      }

      users.set(email, userRecord)

      // Create session token
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      const fingerprint = crypto.createHash('sha256')
        .update(`${req.headers.get('user-agent') || ''}|${ip}`)
        .digest('hex')
        .substring(0, 32)

      const token = createSession(userId, email, fingerprint)

      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          email,
          name: userRecord.name,
          licenseKey,
        },
        token,
        deviceCount: 1,
      })
    }
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
