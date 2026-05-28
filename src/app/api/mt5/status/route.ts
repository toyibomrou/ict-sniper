import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = validateSession(token)
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    // Check DB for MT5 connection
    const connection = await db.mT5Connection.findFirst({
      where: { userId: session.userId },
    })

    // Also try to get live status from bridge
    let bridgeStatus: any = null
    try {
      const res = await fetch(`http://localhost:3004/api/health?XTransformPort=3004`)
      bridgeStatus = await res.json()
    } catch {
      bridgeStatus = { mt5Connected: false }
    }

    return NextResponse.json({
      dbConnection: connection ? {
        id: connection.id,
        accountNumber: connection.accountNumber,
        server: connection.server,
        status: connection.status,
        lastConnected: connection.lastConnected,
        balance: connection.balance,
        equity: connection.equity,
        leverage: connection.leverage,
        currency: connection.currency,
      } : null,
      bridgeStatus,
    })
  } catch (error) {
    console.error('MT5 status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
