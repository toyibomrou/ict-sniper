import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = validateSession(token)
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const { strategyId } = await req.json()

    // Notify the WebSocket service to stop the strategy
    try {
      await fetch('http://localhost:3003/api/stop-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyId, userId: session.userId }),
      })
    } catch {
      // WS service might not be reachable
    }

    return NextResponse.json({
      success: true,
      message: 'Strategy stopped',
      strategyId,
      stoppedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Strategy stop error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
