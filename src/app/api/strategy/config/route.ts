import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = validateSession(token)
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const strategies = await db.strategyConfig.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ strategies })
  } catch (error) {
    console.error('Strategy fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = validateSession(token)
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const body = await req.json()
    const strategy = await db.strategyConfig.create({
      data: {
        userId: session.userId,
        name: body.name || 'ICT Silver Bullet',
        strategyType: body.strategyType || 'silver_bullet',
        pairs: body.pairs || 'EURUSD,GBPUSD,USDJPY',
        timeframe: body.timeframe || 'M5',
        tradingStartHour: body.tradingStartHour ?? 10,
        tradingEndHour: body.tradingEndHour ?? 17,
        sbWindow1: body.sbWindow1 ?? true,
        sbWindow2: body.sbWindow2 ?? true,
        sbWindow3: body.sbWindow3 ?? true,
        maxOpenPositions: body.maxOpenPositions ?? 3,
        riskPerTrade: body.riskPerTrade ?? 1.0,
        maxDailyLoss: body.maxDailyLoss ?? 3.0,
        maxSpreadPips: body.maxSpreadPips ?? 2.0,
        slType: body.slType || 'fvg_boundary',
        slBufferPips: body.slBufferPips ?? 2.0,
        tpType: body.tpType || 'opposite_liquidity',
        fixedRR: body.fixedRR ?? 2.0,
        tpMultiple: body.tpMultiple ?? 1.0,
        fvgMinGapPips: body.fvgMinGapPips ?? 3.0,
        mssMinDisplacement: body.mssMinDisplacement ?? 5.0,
        liquidityWickMin: body.liquidityWickMin ?? 0.7,
      },
    })

    return NextResponse.json({ success: true, strategy })
  } catch (error) {
    console.error('Strategy create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = validateSession(token)
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Strategy ID required' }, { status: 400 })

    const strategy = await db.strategyConfig.update({
      where: { id, userId: session.userId },
      data: updates,
    })

    return NextResponse.json({ success: true, strategy })
  } catch (error) {
    console.error('Strategy update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
