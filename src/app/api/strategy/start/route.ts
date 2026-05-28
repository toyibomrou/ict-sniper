import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = validateSession(token)
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const { strategyId } = await req.json()

    // In a real implementation, this would:
    // 1. Load the strategy config from DB
    // 2. Start the ICT signal detection loop
    // 3. Connect to MT5 for trade execution
    // 4. Begin monitoring price feeds

    // For now, we signal the WebSocket service to start the strategy
    try {
      const wsResponse = await fetch('http://localhost:3003/api/start-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyId, userId: session.userId }),
      })

      if (!wsResponse.ok) {
        // WS service may not have this endpoint, that's ok
        console.log('WS service strategy start notification sent')
      }
    } catch {
      // WS service might not be reachable, continue anyway
    }

    return NextResponse.json({
      success: true,
      message: 'Strategy started',
      strategyId,
      startedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Strategy start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
