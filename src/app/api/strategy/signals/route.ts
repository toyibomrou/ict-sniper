import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = validateSession(token)
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const type = url.searchParams.get('type') // filter by signal type

    const where: any = { userId: session.userId }
    if (type) where.signalType = type

    const signals = await db.signalLog.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ signals })
  } catch (error) {
    console.error('Signals fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
