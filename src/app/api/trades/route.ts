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
    const status = url.searchParams.get('status') || 'open'

    const trades = await db.trade.findMany({
      where: { userId: session.userId, status },
      orderBy: { openedAt: 'desc' },
    })

    return NextResponse.json({ trades })
  } catch (error) {
    console.error('Trades fetch error:', error)
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
    const { symbol, direction, lotSize, entryPrice, stopLoss, takeProfit, signalType, strategyId, confidence, fvgTop, fvgBottom, liquidityLevel, mssDirection } = body

    // Calculate pips
    const pipValue = symbol.includes('JPY') ? 0.01 : 0.0001
    const slPips = Math.abs(entryPrice - stopLoss) / pipValue
    const tpPips = Math.abs(takeProfit - entryPrice) / pipValue

    const trade = await db.trade.create({
      data: {
        userId: session.userId,
        strategyId,
        symbol,
        direction,
        lotSize,
        entryPrice,
        currentPrice: entryPrice,
        stopLoss,
        takeProfit,
        slPips,
        tpPips,
        signalType: signalType || 'manual',
        fvgTop,
        fvgBottom,
        liquidityLevel,
        mssDirection,
        confidence,
        status: 'open',
      },
    })

    // Also attempt to open via MT5 bridge
    try {
      await fetch(`http://localhost:3004/api/trade/open?XTransformPort=3004`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          direction,
          lotSize,
          sl: stopLoss,
          tp: takeProfit,
          comment: `ICT_${signalType || 'manual'}`,
          magic: 123456,
        }),
      })
    } catch {
      // MT5 bridge may not be available
    }

    return NextResponse.json({ success: true, trade })
  } catch (error) {
    console.error('Trade create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = validateSession(token)
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const { tradeId, closePrice, closeReason } = await req.json()

    if (!tradeId) return NextResponse.json({ error: 'Trade ID required' }, { status: 400 })

    const trade = await db.trade.findFirst({
      where: { id: tradeId, userId: session.userId, status: 'open' },
    })

    if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })

    const closePriceVal = closePrice || trade.currentPrice || trade.entryPrice
    const pipValue = trade.symbol.includes('JPY') ? 0.01 : 0.0001

    let pnl = 0
    let pnlPips = 0
    if (trade.direction === 'buy') {
      pnlPips = (closePriceVal - trade.entryPrice) / pipValue
      pnl = pnlPips * trade.lotSize * (trade.symbol.includes('JPY') ? 1000 : 10)
    } else {
      pnlPips = (trade.entryPrice - closePriceVal) / pipValue
      pnl = pnlPips * trade.lotSize * (trade.symbol.includes('JPY') ? 1000 : 10)
    }

    const updated = await db.trade.update({
      where: { id: tradeId },
      data: {
        status: 'closed',
        closePrice: closePriceVal,
        closeReason: closeReason || 'manual',
        pnl,
        pnlPips,
        closedAt: new Date(),
      },
    })

    // Also close via MT5 bridge
    try {
      await fetch(`http://localhost:3004/api/trade/close?XTransformPort=3004`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: parseInt(tradeId.slice(-6), 16) }),
      })
    } catch {
      // MT5 bridge may not be available
    }

    return NextResponse.json({ success: true, trade: updated })
  } catch (error) {
    console.error('Trade close error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
