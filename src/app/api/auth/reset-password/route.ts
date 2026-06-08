import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateResetToken, markResetTokenUsed, hashPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Validate reset token
    const userId = await validateResetToken(token)
    if (!userId) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: hashPassword(newPassword) },
    })

    // Mark token as used
    await markResetTokenUsed(token)

    // Delete all sessions for this user (force re-login)
    await db.session.deleteMany({ where: { userId } })

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. Please sign in with your new password.',
    })
  } catch (error: any) {
    console.error('Reset password error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
