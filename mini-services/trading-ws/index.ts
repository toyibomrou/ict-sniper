import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

interface PriceData {
  symbol: string
  bid: number
  ask: number
  spread: number
  timestamp: string
}

interface OHLC {
  open: number
  high: number
  low: number
  close: number
  timestamp: number
}

interface SignalData {
  id: string
  type: 'fvg' | 'mss'
  symbol: string
  direction: 'bullish' | 'bearish'
  price: number
  confidence: number
  details: Record<string, unknown>
}

interface TradeData {
  id: string
  symbol: string
  direction: 'buy' | 'sell'
  entry: number
  sl: number
  tp: number
  lotSize: number
}

interface StrategyState {
  strategyId: string
  status: 'running' | 'stopped' | 'error'
  config: Record<string, unknown>
  startedAt?: number
}

// ═══════════════════════════════════════════════════════════════════════
// Forex Pair Configuration
// ═══════════════════════════════════════════════════════════════════════

const FOREX_PAIRS: Record<string, { basePrice: number; pipSize: number; decimals: number }> = {
  EURUSD: { basePrice: 1.0850, pipSize: 0.0001, decimals: 5 },
  GBPUSD: { basePrice: 1.2650, pipSize: 0.0001, decimals: 5 },
  USDJPY: { basePrice: 149.50, pipSize: 0.01, decimals: 3 },
  AUDUSD: { basePrice: 0.6520, pipSize: 0.0001, decimals: 5 },
  USDCHF: { basePrice: 0.8820, pipSize: 0.0001, decimals: 5 },
  NZDUSD: { basePrice: 0.6100, pipSize: 0.0001, decimals: 5 },
  USDCAD: { basePrice: 1.3580, pipSize: 0.0001, decimals: 5 },
}

// ═══════════════════════════════════════════════════════════════════════
// Price Simulator
// ═══════════════════════════════════════════════════════════════════════

class PriceSimulator {
  private prices: Map<string, { bid: number; ask: number }> = new Map()
  private candles: Map<string, OHLC[]> = new Map()
  private candleTimers: Map<string, ReturnType<typeof setInterval>> = new Map()
  private tickInterval: ReturnType<typeof setInterval> | null = null
  private onTick: ((data: PriceData) => void) | null = null
  private onCandleClose: ((symbol: string, candle: OHLC) => void) | null = null

  // Candle duration in ms (simulating M5 candles at 10x speed → 30s per candle)
  private readonly CANDLE_DURATION = 30000
  private currentCandleStart: Map<string, { open: number; high: number; low: number; close: number; startTime: number }> = new Map()

  constructor() {
    // Initialize prices
    for (const [symbol, config] of Object.entries(FOREX_PAIRS)) {
      const spread = config.pipSize * (1 + Math.random() * 2)
      const bid = config.basePrice + (Math.random() - 0.5) * config.pipSize * 20
      this.prices.set(symbol, {
        bid: this.round(bid, config.decimals),
        ask: this.round(bid + spread, config.decimals),
      })
      this.candles.set(symbol, [])
      this.currentCandleStart.set(symbol, {
        open: bid,
        high: bid,
        low: bid,
        close: bid,
        startTime: Date.now(),
      })
    }
  }

  private round(value: number, decimals: number): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  start(
    onTick: (data: PriceData) => void,
    onCandleClose: (symbol: string, candle: OHLC) => void
  ) {
    this.onTick = onTick
    this.onCandleClose = onCandleClose

    // Generate price ticks every 1-2 seconds
    this.tickInterval = setInterval(() => {
      this.generateTick()
    }, 1000 + Math.random() * 1000)

    // Check candle closes every second
    const candleChecker = setInterval(() => {
      this.checkCandleClose()
    }, 1000)
    this.candleTimers.set('_candleChecker', candleChecker)
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }
    for (const timer of this.candleTimers.values()) {
      clearInterval(timer)
    }
    this.candleTimers.clear()
  }

  private generateTick() {
    for (const [symbol, config] of Object.entries(FOREX_PAIRS)) {
      const current = this.prices.get(symbol)!
      const currentPrice = current.bid

      // Determine move size: 90% small moves, 10% larger moves (volatility)
      const isVolatile = Math.random() < 0.10
      const moveMultiplier = isVolatile ? (3 + Math.random() * 5) : 1

      // Random walk with slight mean reversion
      const meanReversionForce = (config.basePrice - currentPrice) * 0.001
      const randomMove = (Math.random() - 0.5) * config.pipSize * 5 * moveMultiplier
      const move = randomMove + meanReversionForce

      const newBid = this.round(currentPrice + move, config.decimals)
      const spread = config.pipSize * (0.5 + Math.random() * 2.5)
      const newAsk = this.round(newBid + spread, config.decimals)

      this.prices.set(symbol, { bid: newBid, ask: newAsk })

      // Update current candle
      const candle = this.currentCandleStart.get(symbol)!
      candle.high = Math.max(candle.high, newBid)
      candle.low = Math.min(candle.low, newBid)
      candle.close = newBid

      // Emit tick
      if (this.onTick) {
        this.onTick({
          symbol,
          bid: newBid,
          ask: newAsk,
          spread: this.round((newAsk - newBid) / config.pipSize, 1),
          timestamp: new Date().toISOString(),
        })
      }
    }
  }

  private checkCandleClose() {
    const now = Date.now()
    for (const [symbol] of Object.entries(FOREX_PAIRS)) {
      const candle = this.currentCandleStart.get(symbol)!
      if (now - candle.startTime >= this.CANDLE_DURATION) {
        // Close the candle
        const closedCandle: OHLC = {
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          timestamp: candle.startTime,
        }

        const candleHistory = this.candles.get(symbol)!
        candleHistory.push(closedCandle)
        // Keep last 100 candles
        if (candleHistory.length > 100) {
          candleHistory.shift()
        }

        if (this.onCandleClose) {
          this.onCandleClose(symbol, closedCandle)
        }

        // Start new candle
        this.currentCandleStart.set(symbol, {
          open: candle.close,
          high: candle.close,
          low: candle.close,
          close: candle.close,
          startTime: now,
        })
      }
    }
  }

  getPrice(symbol: string): { bid: number; ask: number } | undefined {
    return this.prices.get(symbol)
  }

  getCandles(symbol: string): OHLC[] {
    return this.candles.get(symbol) || []
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ICT Signal Generator
// ═══════════════════════════════════════════════════════════════════════

class ICTSignalGenerator {
  private onSignal: ((signal: SignalData) => void) | null = null
  // Track swing points for MSS detection
  private swingHighs: Map<string, { price: number; index: number }[]> = new Map()
  private swingLows: Map<string, { price: number; index: number }[]> = new Map()

  constructor() {
    for (const symbol of Object.keys(FOREX_PAIRS)) {
      this.swingHighs.set(symbol, [])
      this.swingLows.set(symbol, [])
    }
  }

  start(onSignal: (signal: SignalData) => void) {
    this.onSignal = onSignal
  }

  stop() {
    this.onSignal = null
  }

  onCandleClose(symbol: string, candle: OHLC, candleIndex: number) {
    this.detectFVG(symbol, candleIndex)
    this.detectMSS(symbol, candle, candleIndex)
    this.updateSwingPoints(symbol, candle, candleIndex)
  }

  private detectFVG(symbol: string, candleIndex: number) {
    const simulator = priceSimulator
    const candles = simulator.getCandles(symbol)
    if (candles.length < 3) return

    // Check last 3 candles
    const len = candles.length
    const c1 = candles[len - 3]
    const c2 = candles[len - 2]
    const c3 = candles[len - 1]

    const config = FOREX_PAIRS[symbol]
    if (!config) return

    // Bullish FVG: Candle 1 high < Candle 3 low (gap up)
    if (c1.high < c3.low) {
      const gapSize = (c3.low - c1.high) / config.pipSize
      if (gapSize >= 3) {
        // Minimum 3 pip gap
        const confidence = Math.min(95, Math.max(50, 50 + gapSize * 5))
        this.emitSignal({
          id: `fvg-${symbol}-${Date.now()}`,
          type: 'fvg',
          symbol,
          direction: 'bullish',
          price: c3.low,
          confidence: Math.round(confidence),
          details: {
            gapSizePips: Math.round(gapSize * 10) / 10,
            fvgTop: c3.low,
            fvgBottom: c1.high,
            candlePattern: [c1, c2, c3].map((c) => ({
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
            })),
          },
        })
      }
    }

    // Bearish FVG: Candle 1 low > Candle 3 high (gap down)
    if (c1.low > c3.high) {
      const gapSize = (c1.low - c3.high) / config.pipSize
      if (gapSize >= 3) {
        const confidence = Math.min(95, Math.max(50, 50 + gapSize * 5))
        this.emitSignal({
          id: `fvg-${symbol}-${Date.now()}`,
          type: 'fvg',
          symbol,
          direction: 'bearish',
          price: c3.high,
          confidence: Math.round(confidence),
          details: {
            gapSizePips: Math.round(gapSize * 10) / 10,
            fvgTop: c1.low,
            fvgBottom: c3.high,
            candlePattern: [c1, c2, c3].map((c) => ({
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
            })),
          },
        })
      }
    }
  }

  private updateSwingPoints(symbol: string, candle: OHLC, candleIndex: number) {
    const highs = this.swingHighs.get(symbol)!
    const lows = this.swingLows.get(symbol)!

    // Simple swing point detection: a candle whose high is higher than neighbors
    // We just track the most recent notable highs and lows
    if (highs.length === 0 || candle.high > highs[highs.length - 1].price) {
      highs.push({ price: candle.high, index: candleIndex })
      if (highs.length > 20) highs.shift()
    }
    if (lows.length === 0 || candle.low < lows[lows.length - 1].price) {
      lows.push({ price: candle.low, index: candleIndex })
      if (lows.length > 20) lows.shift()
    }
  }

  private detectMSS(symbol: string, candle: OHLC, candleIndex: number) {
    const highs = this.swingHighs.get(symbol)!
    const lows = this.swingLows.get(symbol)!

    if (highs.length < 2 || lows.length < 2) return

    const config = FOREX_PAIRS[symbol]
    if (!config) return

    const lastSwingHigh = highs[highs.length - 1]
    const lastSwingLow = lows[lows.length - 1]

    // Bullish MSS: Price breaks above recent swing high
    if (candle.close > lastSwingHigh.price) {
      const displacement = (candle.close - lastSwingHigh.price) / config.pipSize
      if (displacement >= 5) {
        const confidence = Math.min(95, Math.max(50, 55 + displacement * 3))
        this.emitSignal({
          id: `mss-${symbol}-${Date.now()}`,
          type: 'mss',
          symbol,
          direction: 'bullish',
          price: candle.close,
          confidence: Math.round(confidence),
          details: {
            brokenLevel: lastSwingHigh.price,
            displacementPips: Math.round(displacement * 10) / 10,
            swingHighIndex: lastSwingHigh.index,
          },
        })
      }
    }

    // Bearish MSS: Price breaks below recent swing low
    if (candle.close < lastSwingLow.price) {
      const displacement = (lastSwingLow.price - candle.close) / config.pipSize
      if (displacement >= 5) {
        const confidence = Math.min(95, Math.max(50, 55 + displacement * 3))
        this.emitSignal({
          id: `mss-${symbol}-${Date.now()}`,
          type: 'mss',
          symbol,
          direction: 'bearish',
          price: candle.close,
          confidence: Math.round(confidence),
          details: {
            brokenLevel: lastSwingLow.price,
            displacementPips: Math.round(displacement * 10) / 10,
            swingLowIndex: lastSwingLow.index,
          },
        })
      }
    }
  }

  private emitSignal(signal: SignalData) {
    if (this.onSignal) {
      this.onSignal(signal)
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Trade Simulator (simulates trades opened from ICT signals)
// ═══════════════════════════════════════════════════════════════════════

class TradeSimulator {
  private openTrades: Map<string, TradeData & { pnl: number }> = new Map()
  private onTradeOpened: ((trade: TradeData) => void) | null = null
  private onTradeClosed: ((trade: TradeData & { pnl: number; closeReason: string }) => void) | null = null
  private checkInterval: ReturnType<typeof setInterval> | null = null

  start(
    onTradeOpened: (trade: TradeData) => void,
    onTradeClosed: (trade: TradeData & { pnl: number; closeReason: string }) => void
  ) {
    this.onTradeOpened = onTradeOpened
    this.onTradeClosed = onTradeClosed

    // Check trades against current prices every 2 seconds
    this.checkInterval = setInterval(() => {
      this.checkTrades()
    }, 2000)
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  openTrade(signal: SignalData) {
    const config = FOREX_PAIRS[signal.symbol]
    if (!config) return

    // Random chance to open a trade from a signal (30%)
    if (Math.random() > 0.30) return

    const price = priceSimulator.getPrice(signal.symbol)
    if (!price) return

    const entry = signal.direction === 'bullish' ? price.ask : price.bid
    const slDistance = config.pipSize * (15 + Math.random() * 20) // 15-35 pips SL
    const tpDistance = slDistance * (1.5 + Math.random() * 1.5) // 1.5-3.0 R:R

    const direction: 'buy' | 'sell' = signal.direction === 'bullish' ? 'buy' : 'sell'
    const sl = direction === 'buy' ? entry - slDistance : entry + slDistance
    const tp = direction === 'buy' ? entry + tpDistance : entry - tpDistance

    const trade: TradeData = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      symbol: signal.symbol,
      direction,
      entry: Math.round(entry * Math.pow(10, config.decimals)) / Math.pow(10, config.decimals),
      sl: Math.round(sl * Math.pow(10, config.decimals)) / Math.pow(10, config.decimals),
      tp: Math.round(tp * Math.pow(10, config.decimals)) / Math.pow(10, config.decimals),
      lotSize: Math.round((0.01 + Math.random() * 0.09) * 100) / 100, // 0.01-0.10 lots
    }

    this.openTrades.set(trade.id, { ...trade, pnl: 0 })

    if (this.onTradeOpened) {
      this.onTradeOpened(trade)
    }
  }

  private checkTrades() {
    for (const [tradeId, trade] of this.openTrades.entries()) {
      const price = priceSimulator.getPrice(trade.symbol)
      if (!price) continue

      const currentPrice = trade.direction === 'buy' ? price.bid : price.ask
      const config = FOREX_PAIRS[trade.symbol]
      if (!config) continue

      // Calculate PnL in pips
      const pnlPips =
        trade.direction === 'buy'
          ? (currentPrice - trade.entry) / config.pipSize
          : (trade.entry - currentPrice) / config.pipSize

      let closeReason: string | null = null

      // Check SL hit
      if (trade.direction === 'buy' && currentPrice <= trade.sl) {
        closeReason = 'sl_hit'
      } else if (trade.direction === 'sell' && currentPrice >= trade.sl) {
        closeReason = 'sl_hit'
      }

      // Check TP hit
      if (trade.direction === 'buy' && currentPrice >= trade.tp) {
        closeReason = 'tp_hit'
      } else if (trade.direction === 'sell' && currentPrice <= trade.tp) {
        closeReason = 'tp_hit'
      }

      // Random close for manual/trailing stop simulation (very rare, ~0.5%)
      if (!closeReason && Math.random() < 0.005) {
        closeReason = pnlPips > 5 ? 'trailing_stop' : 'manual'
      }

      if (closeReason) {
        this.openTrades.delete(tradeId)
        if (this.onTradeClosed) {
          this.onTradeClosed({
            ...trade,
            pnl: Math.round(pnlPips * 10) / 10,
            closeReason,
          })
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Socket.io Server Setup
// ═══════════════════════════════════════════════════════════════════════

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// ═══════════════════════════════════════════════════════════════════════
// Global State
// ═══════════════════════════════════════════════════════════════════════

// Track which pairs each socket is subscribed to
const socketSubscriptions = new Map<string, Set<string>>()
// Track which userId each socket belongs to
const socketUsers = new Map<string, string>()
// Active strategies
const activeStrategies = new Map<string, StrategyState>()
// Candle index tracker per symbol
const candleIndex = new Map<string, number>()

// Initialize services
const priceSimulator = new PriceSimulator()
const ictSignalGenerator = new ICTSignalGenerator()
const tradeSimulator = new TradeSimulator()

// ═══════════════════════════════════════════════════════════════════════
// Start Services
// ═══════════════════════════════════════════════════════════════════════

// Start price simulator
priceSimulator.start(
  // On tick: broadcast to subscribed sockets
  (data: PriceData) => {
    for (const [socketId, pairs] of socketSubscriptions.entries()) {
      if (pairs.has(data.symbol)) {
        io.to(socketId).emit('price-update', data)
      }
    }
  },
  // On candle close: run signal detection
  (symbol: string, candle: OHLC) => {
    const idx = (candleIndex.get(symbol) || 0) + 1
    candleIndex.set(symbol, idx)
    ictSignalGenerator.onCandleClose(symbol, candle, idx)
  }
)

// Start signal generator
ictSignalGenerator.start((signal: SignalData) => {
  console.log(`[ICT Signal] ${signal.type.toUpperCase()} ${signal.direction} on ${signal.symbol} @ ${signal.price} (confidence: ${signal.confidence}%)`)

  // Broadcast to all sockets subscribed to this symbol
  for (const [socketId, pairs] of socketSubscriptions.entries()) {
    if (pairs.has(signal.symbol)) {
      io.to(socketId).emit('signal-detected', signal)
    }
  }

  // Maybe open a trade
  tradeSimulator.openTrade(signal)
})

// Start trade simulator
tradeSimulator.start(
  (trade: TradeData) => {
    console.log(`[Trade Opened] ${trade.direction.toUpperCase()} ${trade.symbol} @ ${trade.entry} | SL: ${trade.sl} TP: ${trade.tp}`)
    // Broadcast to all sockets subscribed to this symbol
    for (const [socketId, pairs] of socketSubscriptions.entries()) {
      if (pairs.has(trade.symbol)) {
        io.to(socketId).emit('trade-opened', trade)
      }
    }
  },
  (trade: TradeData & { pnl: number; closeReason: string }) => {
    console.log(`[Trade Closed] ${trade.direction.toUpperCase()} ${trade.symbol} | PnL: ${trade.pnl} pips | Reason: ${trade.closeReason}`)
    // Broadcast to all sockets subscribed to this symbol
    for (const [socketId, pairs] of socketSubscriptions.entries()) {
      if (pairs.has(trade.symbol)) {
        io.to(socketId).emit('trade-closed', trade)
      }
    }
  }
)

// Simulate MT5 connection status changes
let mt5Connected = true
setInterval(() => {
  // 98% chance stays connected, 2% chance of brief disconnect
  const wasConnected = mt5Connected
  mt5Connected = Math.random() > 0.02

  if (wasConnected !== mt5Connected) {
    const statusData = {
      connected: mt5Connected,
      accountInfo: mt5Connected
        ? {
            balance: 10000 + Math.random() * 5000,
            equity: 10000 + Math.random() * 5000,
            leverage: 100,
            currency: 'USD',
            server: 'MetaQuotes-Demo',
          }
        : null,
    }
    io.emit('connection-status', statusData)
    console.log(`[MT5] Connection status: ${mt5Connected ? 'CONNECTED' : 'DISCONNECTED'}`)

    // Auto-reconnect after a brief disconnect
    if (!mt5Connected) {
      setTimeout(() => {
        mt5Connected = true
        io.emit('connection-status', {
          connected: true,
          accountInfo: {
            balance: 10000 + Math.random() * 5000,
            equity: 10000 + Math.random() * 5000,
            leverage: 100,
            currency: 'USD',
            server: 'MetaQuotes-Demo',
          },
        })
        console.log('[MT5] Reconnected')
      }, 3000 + Math.random() * 5000)
    }
  }
}, 30000)

// ═══════════════════════════════════════════════════════════════════════
// Socket Connection Handler
// ═══════════════════════════════════════════════════════════════════════

io.on('connection', (socket: Socket) => {
  console.log(`[WS] Client connected: ${socket.id}`)

  // Initialize subscriptions for this socket
  socketSubscriptions.set(socket.id, new Set())

  // Send initial MT5 connection status
  socket.emit('connection-status', {
    connected: mt5Connected,
    accountInfo: mt5Connected
      ? {
          balance: 10000 + Math.random() * 5000,
          equity: 10000 + Math.random() * 5000,
          leverage: 100,
          currency: 'USD',
          server: 'MetaQuotes-Demo',
        }
      : null,
  })

  // ─── Subscribe to price updates ───────────────────────────────────
  socket.on('subscribe', (data: { pairs: string[]; userId: string }) => {
    const { pairs, userId } = data

    // Store userId mapping
    if (userId) {
      socketUsers.set(socket.id, userId)
    }

    const subs = socketSubscriptions.get(socket.id)
    if (!subs) return

    for (const pair of pairs) {
      const normalizedPair = pair.toUpperCase()
      if (FOREX_PAIRS[normalizedPair]) {
        subs.add(normalizedPair)
        socket.join(`pair:${normalizedPair}`)
        console.log(`[WS] ${socket.id} subscribed to ${normalizedPair}`)
      }
    }

    // Send current prices for newly subscribed pairs
    for (const pair of subs) {
      const price = priceSimulator.getPrice(pair)
      if (price) {
        const config = FOREX_PAIRS[pair]!
        socket.emit('price-update', {
          symbol: pair,
          bid: price.bid,
          ask: price.ask,
          spread: Math.round(((price.ask - price.bid) / config.pipSize) * 10) / 10,
          timestamp: new Date().toISOString(),
        })
      }
    }
  })

  // ─── Unsubscribe from price updates ───────────────────────────────
  socket.on('unsubscribe', (data: { pairs: string[] }) => {
    const { pairs } = data
    const subs = socketSubscriptions.get(socket.id)
    if (!subs) return

    for (const pair of pairs) {
      const normalizedPair = pair.toUpperCase()
      subs.delete(normalizedPair)
      socket.leave(`pair:${normalizedPair}`)
      console.log(`[WS] ${socket.id} unsubscribed from ${normalizedPair}`)
    }
  })

  // ─── Strategy Control ─────────────────────────────────────────────
  socket.on(
    'strategy-control',
    (data: { action: 'start' | 'stop'; strategyId: string; config: object }) => {
      const { action, strategyId, config } = data
      console.log(`[Strategy] ${action.toUpperCase()} strategy ${strategyId}`)

      if (action === 'start') {
        const strategyState: StrategyState = {
          strategyId,
          status: 'running',
          config,
          startedAt: Date.now(),
        }
        activeStrategies.set(strategyId, strategyState)

        // Broadcast status update
        io.emit('strategy-status', {
          strategyId,
          status: 'running',
          message: `Strategy ${strategyId} started successfully`,
        })

        // Simulate a strategy status update after a few seconds
        setTimeout(() => {
          if (activeStrategies.has(strategyId)) {
            io.emit('strategy-status', {
              strategyId,
              status: 'running',
              message: `Strategy ${strategyId} is analyzing markets...`,
            })
          }
        }, 3000)
      } else if (action === 'stop') {
        activeStrategies.delete(strategyId)

        io.emit('strategy-status', {
          strategyId,
          status: 'stopped',
          message: `Strategy ${strategyId} stopped`,
        })
      }
    }
  )

  // ─── Disconnect ───────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    console.log(`[WS] Client disconnected: ${socket.id} (${reason})`)
    socketSubscriptions.delete(socket.id)
    socketUsers.delete(socket.id)
  })

  // ─── Error ────────────────────────────────────────────────────────
  socket.on('error', (error) => {
    console.error(`[WS] Socket error (${socket.id}):`, error)
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Start Server
// ═══════════════════════════════════════════════════════════════════════

const PORT = 3003

httpServer.listen(PORT, () => {
  console.log(`╔══════════════════════════════════════════════════════════╗`)
  console.log(`║   ICT Trading Bot - WebSocket Service                   ║`)
  console.log(`║   Running on port ${PORT}                                  ║`)
  console.log(`║   Socket.io path: /                                     ║`)
  console.log(`║   Forex pairs: ${Object.keys(FOREX_PAIRS).join(', ')}  ║`)
  console.log(`╚══════════════════════════════════════════════════════════╝`)
})

// ═══════════════════════════════════════════════════════════════════════
// Graceful Shutdown
// ═══════════════════════════════════════════════════════════════════════

const gracefulShutdown = () => {
  console.log('\n[Server] Shutting down gracefully...')
  priceSimulator.stop()
  ictSignalGenerator.stop()
  tradeSimulator.stop()
  io.close()
  httpServer.close(() => {
    console.log('[Server] HTTP server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
