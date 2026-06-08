import { NextResponse } from 'next/server'
import { cleanupOldSignals, cleanupOldTrades, cleanupExpiredSessions, cleanupExpiredResetTokens } from '@/lib/auth'

export async function POST() {
  try {
    const [signalsDeleted, tradesDeleted, sessionsDeleted, tokensDeleted] = await Promise.all([
      cleanupOldSignals(6),
      cleanupOldTrades(12),
      cleanupExpiredSessions(),
      cleanupExpiredResetTokens(),
    ])

    return NextResponse.json({
      success: true,
      cleanup: {
        signalsDeleted,
        tradesDeleted,
        sessionsDeleted,
        tokensDeleted,
      },
    })
  } catch (error: any) {
    console.error('Maintenance error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
