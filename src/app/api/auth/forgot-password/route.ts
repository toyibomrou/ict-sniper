import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createPasswordReset } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find user
    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      // Don't reveal whether email exists — return success anyway
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a reset link has been sent.',
      })
    }

    if (!user.isActive) {
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a reset link has been sent.',
      })
    }

    // Create reset token
    const resetToken = await createPasswordReset(user.id)

    // In production, send email with reset link
    // For now, return the token directly (will be replaced with email sending)
    const resetUrl = `${req.headers.get('origin') || 'https://ict-sniper.vercel.app'}?reset=${resetToken}`

    console.log(`Password reset requested for ${email}. Reset URL: ${resetUrl}`)

    // TODO: Send email with reset URL using an email service (Resend, SendGrid, etc.)
    // For now, we'll store the token and the user can use it from the UI

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a reset link has been sent.',
      // Development only: include token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken, resetUrl }),
    })
  } catch (error: any) {
    console.error('Forgot password error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
