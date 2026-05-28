/**
 * ICT (Inner Circle Trader) Strategy Engine
 * 
 * Implements:
 * - Silver Bullet detection (time-based FVG entries)
 * - Market Maker Models (Buy/Sell)
 * - Fair Value Gap (FVG) detection
 * - Market Structure Shift (MSS) detection
 * - Liquidity sweep identification
 * - Order Block detection
 */

// ─── Types ──────────────────────────────────────────────────────────────

export type Direction = 'bullish' | 'bearish'
export type SignalType = 'silver_bullet' | 'mmm_buy' | 'mmm_sell' | 'fvg' | 'mss' | 'liquidity_sweep' | 'order_block'
export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1'

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface FVG {
  direction: Direction
  top: number
  bottom: number
  gapSize: number
  candle1Index: number
  candle3Index: number
  fillPercentage: number
  timestamp: number
}

export interface SwingPoint {
  type: 'high' | 'low'
  price: number
  index: number
  timestamp: number
}

export interface MSS {
  direction: Direction
  brokenSwing: SwingPoint
  displacementCandles: Candle[]
  displacementPips: number
  timestamp: number
}

export interface LiquiditySweep {
  direction: 'buy_side' | 'sell_side'
  level: number
  wickPercentage: number
  isSwept: boolean
  timestamp: number
}

export interface OrderBlock {
  direction: Direction
  type: 'bullish' | 'bearish'
  high: number
  low: number
  mitigationPercentage: number
  candleIndex: number
  timestamp: number
}

export interface ICTSignal {
  id: string
  type: SignalType
  symbol: string
  timeframe: Timeframe
  direction: Direction
  price: number
  confidence: number // 0-100
  timestamp: number
  fvg?: FVG
  mss?: MSS
  liquiditySweep?: LiquiditySweep
  orderBlock?: OrderBlock
  entry?: number
  stopLoss?: number
  takeProfit?: number
  riskRewardRatio?: number
}

export interface SilverBulletWindow {
  name: string
  startHour: number // EST
  endHour: number   // EST
  enabled: boolean
}

// Default Silver Bullet windows (EST)
export const SILVER_BULLET_WINDOWS: SilverBulletWindow[] = [
  { name: 'AM Session', startHour: 10, endHour: 11, enabled: true },
  { name: 'PM Session', startHour: 14, endHour: 15, enabled: true },
  { name: 'Close Session', startHour: 16, endHour: 17, enabled: true },
]

export interface StrategyConfig {
  strategyType: 'silver_bullet' | 'market_maker_buy' | 'market_maker_sell' | 'hybrid'
  pairs: string[]
  timeframe: Timeframe
  tradingStartHour: number
  tradingEndHour: number
  sbWindows: SilverBulletWindow[]
  maxOpenPositions: number
  riskPerTrade: number
  maxDailyLoss: number
  maxSpreadPips: number
  slType: 'fixed' | 'fvg_boundary' | 'liquidity_sweep' | 'atr'
  slBufferPips: number
  tpType: 'fixed_rr' | 'opposite_liquidity' | 'fvg_fill'
  fixedRR: number
  tpMultiple: number
  fvgMinGapPips: number
  mssMinDisplacement: number
  liquidityWickMin: number
}

// ─── ICT Detection Functions ────────────────────────────────────────────

/**
 * Detect Fair Value Gaps in a candle series
 * Bullish FVG: candle[0].high < candle[2].low (gap up)
 * Bearish FVG: candle[0].low > candle[2].high (gap down)
 */
export function detectFVGs(
  candles: Candle[],
  minGapPips: number = 3,
  pipValue: number = 0.0001
): FVG[] {
  const fvgs: FVG[] = []

  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2]
    const c2 = candles[i - 1]
    const c3 = candles[i]

    // Bullish FVG: gap between c1 high and c3 low
    if (c1.high < c3.low) {
      const gapSize = (c3.low - c1.high) / pipValue
      if (gapSize >= minGapPips) {
        // Check how much of the gap has been filled by c2
        const filledByMiddle = Math.max(0, c2.low - c1.high) / (c3.low - c1.high)
        const fillPercentage = Math.min(100, filledByMiddle * 100)

        fvgs.push({
          direction: 'bullish',
          top: c3.low,
          bottom: c1.high,
          gapSize,
          candle1Index: i - 2,
          candle3Index: i,
          fillPercentage,
          timestamp: c3.time,
        })
      }
    }

    // Bearish FVG: gap between c1 low and c3 high
    if (c1.low > c3.high) {
      const gapSize = (c1.low - c3.high) / pipValue
      if (gapSize >= minGapPips) {
        const filledByMiddle = Math.max(0, c1.low - c2.high) / (c1.low - c3.high)
        const fillPercentage = Math.min(100, filledByMiddle * 100)

        fvgs.push({
          direction: 'bearish',
          top: c1.low,
          bottom: c3.high,
          gapSize,
          candle1Index: i - 2,
          candle3Index: i,
          fillPercentage,
          timestamp: c3.time,
        })
      }
    }
  }

  return fvgs
}

/**
 * Detect swing points (swing highs and lows) in a candle series
 * A swing high requires lower highs on both sides
 * A swing low requires higher lows on both sides
 */
export function detectSwingPoints(
  candles: Candle[],
  lookback: number = 3
): SwingPoint[] {
  const swings: SwingPoint[] = []

  for (let i = lookback; i < candles.length - lookback; i++) {
    // Check for swing high
    let isSwingHigh = true
    for (let j = 1; j <= lookback; j++) {
      if (candles[i].high <= candles[i - j].high || candles[i].high <= candles[i + j].high) {
        isSwingHigh = false
        break
      }
    }
    if (isSwingHigh) {
      swings.push({
        type: 'high',
        price: candles[i].high,
        index: i,
        timestamp: candles[i].time,
      })
    }

    // Check for swing low
    let isSwingLow = true
    for (let j = 1; j <= lookback; j++) {
      if (candles[i].low >= candles[i - j].low || candles[i].low >= candles[i + j].low) {
        isSwingLow = false
        break
      }
    }
    if (isSwingLow) {
      swings.push({
        type: 'low',
        price: candles[i].low,
        index: i,
        timestamp: candles[i].time,
      })
    }
  }

  return swings
}

/**
 * Detect Market Structure Shift (MSS)
 * Bullish MSS: price breaks above a swing high with displacement
 * Bearish MSS: price breaks below a swing low with displacement
 */
export function detectMSS(
  candles: Candle[],
  swingPoints: SwingPoint[],
  minDisplacementPips: number = 5,
  pipValue: number = 0.0001
): MSS[] {
  const msss: MSS[] = []

  for (let i = 1; i < swingPoints.length; i++) {
    const prev = swingPoints[i - 1]
    const curr = swingPoints[i]

    // Bullish MSS: previous swing low broken, then new higher low + higher high
    if (prev.type === 'low' && curr.type === 'high') {
      const displacement = (curr.price - prev.price) / pipValue
      if (displacement >= minDisplacementPips) {
        // Check if this high breaks a previous lower high
        const previousHighs = swingPoints
          .filter(s => s.type === 'high' && s.index < prev.index)
          .slice(-1)

        if (previousHighs.length > 0 && curr.price > previousHighs[0].price) {
          const displacementCandles = candles.slice(
            Math.min(prev.index, curr.index),
            Math.max(prev.index, curr.index) + 1
          )

          msss.push({
            direction: 'bullish',
            brokenSwing: previousHighs[0],
            displacementCandles,
            displacementPips: displacement,
            timestamp: curr.timestamp,
          })
        }
      }
    }

    // Bearish MSS: previous swing high broken, then new lower high + lower low
    if (prev.type === 'high' && curr.type === 'low') {
      const displacement = (prev.price - curr.price) / pipValue
      if (displacement >= minDisplacementPips) {
        const previousLows = swingPoints
          .filter(s => s.type === 'low' && s.index < prev.index)
          .slice(-1)

        if (previousLows.length > 0 && curr.price < previousLows[0].price) {
          const displacementCandles = candles.slice(
            Math.min(prev.index, curr.index),
            Math.max(prev.index, curr.index) + 1
          )

          msss.push({
            direction: 'bearish',
            brokenSwing: previousLows[0],
            displacementCandles,
            displacementPips: displacement,
            timestamp: curr.timestamp,
          })
        }
      }
    }
  }

  return msss
}

/**
 * Detect liquidity sweeps
 * Buy-side liquidity: price wicks above a swing high then reverses
 * Sell-side liquidity: price wicks below a swing low then reverses
 */
export function detectLiquiditySweeps(
  candles: Candle[],
  swingPoints: SwingPoint[],
  minWickRatio: number = 0.7
): LiquiditySweep[] {
  const sweeps: LiquiditySweep[] = []
  const recentCandles = candles.slice(-20) // Look at recent candles

  for (const swing of swingPoints) {
    for (const candle of recentCandles) {
      if (candle.time <= swing.timestamp) continue

      const bodySize = Math.abs(candle.close - candle.open)
      const totalRange = candle.high - candle.low

      if (totalRange === 0) continue
      const wickRatio = bodySize / totalRange

      // Buy-side liquidity sweep: wick above swing high
      if (swing.type === 'high' && candle.high > swing.price && wickRatio < (1 - minWickRatio)) {
        sweeps.push({
          direction: 'buy_side',
          level: swing.price,
          wickPercentage: 1 - wickRatio,
          isSwept: true,
          timestamp: candle.time,
        })
      }

      // Sell-side liquidity sweep: wick below swing low
      if (swing.type === 'low' && candle.low < swing.price && wickRatio < (1 - minWickRatio)) {
        sweeps.push({
          direction: 'sell_side',
          level: swing.price,
          wickPercentage: 1 - wickRatio,
          isSwept: true,
          timestamp: candle.time,
        })
      }
    }
  }

  return sweeps
}

/**
 * Detect Order Blocks
 * Bullish OB: last bearish candle before a bullish displacement
 * Bearish OB: last bullish candle before a bearish displacement
 */
export function detectOrderBlocks(
  candles: Candle[],
  displacementThreshold: number = 5,
  pipValue: number = 0.0001
): OrderBlock[] {
  const obs: OrderBlock[] = []

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1]
    const curr = candles[i]

    const displacement = Math.abs(curr.close - curr.open) / pipValue

    if (displacement >= displacementThreshold) {
      // Bullish displacement after bearish candle = bullish OB
      if (curr.close > curr.open && prev.close < prev.open) {
        obs.push({
          direction: 'bullish',
          type: 'bullish',
          high: prev.high,
          low: prev.low,
          mitigationPercentage: 0,
          candleIndex: i - 1,
          timestamp: prev.time,
        })
      }

      // Bearish displacement after bullish candle = bearish OB
      if (curr.close < curr.open && prev.close > prev.open) {
        obs.push({
          direction: 'bearish',
          type: 'bearish',
          high: prev.high,
          low: prev.low,
          mitigationPercentage: 0,
          candleIndex: i - 1,
          timestamp: prev.time,
        })
      }
    }
  }

  return obs
}

// ─── Silver Bullet Strategy ────────────────────────────────────────────

/**
 * Check if current time falls within a Silver Bullet trading window
 */
export function isInSilverBulletWindow(
  windows: SilverBulletWindow[],
  currentHourEST: number
): SilverBulletWindow | null {
  for (const window of windows) {
    if (window.enabled && currentHourEST >= window.startHour && currentHourEST < window.endHour) {
      return window
    }
  }
  return null
}

/**
 * Generate a Silver Bullet signal
 * Requires: FVG + MSS in the same direction during an SB window
 */
export function generateSilverBulletSignal(
  fvgs: FVG[],
  msss: MSS[],
  currentPrice: number,
  symbol: string,
  timeframe: Timeframe,
  window: SilverBulletWindow,
  config: StrategyConfig
): ICTSignal | null {
  // Find bullish setup: bearish FVG filled partially + bullish MSS
  const bullishFVGs = fvgs.filter(f => f.direction === 'bullish' && f.fillPercentage < 80)
  const bullishMSS = msss.filter(m => m.direction === 'bullish')

  if (bullishFVGs.length > 0 && bullishMSS.length > 0) {
    const fvg = bullishFVGs[bullishFVGs.length - 1] // Most recent
    const mss = bullishMSS[bullishMSS.length - 1]

    const entry = currentPrice
    const sl = fvg.bottom - config.slBufferPips * 0.0001
    const tp = entry + (entry - sl) * config.fixedRR
    const rr = (tp - entry) / (entry - sl)

    return {
      id: `sb_bull_${Date.now()}`,
      type: 'silver_bullet',
      symbol,
      timeframe,
      direction: 'bullish',
      price: currentPrice,
      confidence: calculateConfidence(fvg, mss, 75),
      timestamp: Date.now(),
      fvg,
      mss,
      entry,
      stopLoss: sl,
      takeProfit: tp,
      riskRewardRatio: rr,
    }
  }

  // Find bearish setup: bullish FVG filled partially + bearish MSS
  const bearishFVGs = fvgs.filter(f => f.direction === 'bearish' && f.fillPercentage < 80)
  const bearishMSS = msss.filter(m => m.direction === 'bearish')

  if (bearishFVGs.length > 0 && bearishMSS.length > 0) {
    const fvg = bearishFVGs[bearishFVGs.length - 1]
    const mss = bearishMSS[bearishMSS.length - 1]

    const entry = currentPrice
    const sl = fvg.top + config.slBufferPips * 0.0001
    const tp = entry - (sl - entry) * config.fixedRR
    const rr = (entry - tp) / (sl - entry)

    return {
      id: `sb_bear_${Date.now()}`,
      type: 'silver_bullet',
      symbol,
      timeframe,
      direction: 'bearish',
      price: currentPrice,
      confidence: calculateConfidence(fvg, mss, 75),
      timestamp: Date.now(),
      fvg,
      mss,
      entry,
      stopLoss: sl,
      takeProfit: tp,
      riskRewardRatio: rr,
    }
  }

  return null
}

// ─── Market Maker Model Strategy ────────────────────────────────────────

/**
 * Generate Market Maker Buy Model signal
 * Sequence: Sell-side liquidity sweep → Bullish MSS → Bullish FVG → Entry
 */
export function generateMMMBuySignal(
  liquiditySweeps: LiquiditySweep[],
  msss: MSS[],
  fvgs: FVG[],
  currentPrice: number,
  symbol: string,
  timeframe: Timeframe,
  config: StrategyConfig
): ICTSignal | null {
  // Need sell-side liquidity sweep
  const sellSideSweeps = liquiditySweeps.filter(s => s.direction === 'sell_side' && s.isSwept)
  if (sellSideSweeps.length === 0) return null

  // Need bullish MSS after the sweep
  const bullishMSS = msss.filter(m => m.direction === 'bullish')
  if (bullishMSS.length === 0) return null

  // Need bullish FVG after the MSS
  const bullishFVGs = fvgs.filter(f => f.direction === 'bullish' && f.fillPercentage < 80)
  if (bullishFVGs.length === 0) return null

  const sweep = sellSideSweeps[sellSideSweeps.length - 1]
  const mss = bullishMSS[bullishMSS.length - 1]
  const fvg = bullishFVGs[bullishFVGs.length - 1]

  const entry = currentPrice
  const sl = sweep.level - config.slBufferPips * 0.0001
  const tp = entry + (entry - sl) * config.fixedRR
  const rr = (tp - entry) / (entry - sl)

  return {
    id: `mmm_buy_${Date.now()}`,
    type: 'mmm_buy',
    symbol,
    timeframe,
    direction: 'bullish',
    price: currentPrice,
    confidence: calculateConfidence(fvg, mss, 80),
    timestamp: Date.now(),
    fvg,
    mss,
    liquiditySweep: sweep,
    entry,
    stopLoss: sl,
    takeProfit: tp,
    riskRewardRatio: rr,
  }
}

/**
 * Generate Market Maker Sell Model signal
 * Sequence: Buy-side liquidity sweep → Bearish MSS → Bearish FVG → Entry
 */
export function generateMMMSellSignal(
  liquiditySweeps: LiquiditySweep[],
  msss: MSS[],
  fvgs: FVG[],
  currentPrice: number,
  symbol: string,
  timeframe: Timeframe,
  config: StrategyConfig
): ICTSignal | null {
  const buySideSweeps = liquiditySweeps.filter(s => s.direction === 'buy_side' && s.isSwept)
  if (buySideSweeps.length === 0) return null

  const bearishMSS = msss.filter(m => m.direction === 'bearish')
  if (bearishMSS.length === 0) return null

  const bearishFVGs = fvgs.filter(f => f.direction === 'bearish' && f.fillPercentage < 80)
  if (bearishFVGs.length === 0) return null

  const sweep = buySideSweeps[buySideSweeps.length - 1]
  const mss = bearishMSS[bearishMSS.length - 1]
  const fvg = bearishFVGs[bearishFVGs.length - 1]

  const entry = currentPrice
  const sl = sweep.level + config.slBufferPips * 0.0001
  const tp = entry - (sl - entry) * config.fixedRR
  const rr = (entry - tp) / (sl - entry)

  return {
    id: `mmm_sell_${Date.now()}`,
    type: 'mmm_sell',
    symbol,
    timeframe,
    direction: 'bearish',
    price: currentPrice,
    confidence: calculateConfidence(fvg, mss, 80),
    timestamp: Date.now(),
    fvg,
    mss,
    liquiditySweep: sweep,
    entry,
    stopLoss: sl,
    takeProfit: tp,
    riskRewardRatio: rr,
  }
}

// ─── Helper Functions ───────────────────────────────────────────────────

function calculateConfidence(fvg: FVG, mss: MSS, baseConfidence: number): number {
  let confidence = baseConfidence

  // Higher FVG gap = more confidence
  if (fvg.gapSize > 5) confidence += 5
  if (fvg.gapSize > 10) confidence += 5

  // Less fill = more confidence (fresh FVG)
  if (fvg.fillPercentage < 30) confidence += 5
  if (fvg.fillPercentage < 10) confidence += 5

  // More displacement in MSS = more confidence
  if (mss.displacementPips > 10) confidence += 5
  if (mss.displacementPips > 20) confidence += 3

  return Math.min(95, Math.max(50, confidence))
}

/**
 * Get pip value for a symbol
 */
export function getPipValue(symbol: string): number {
  // JPY pairs
  if (symbol.includes('JPY')) return 0.01
  // XAU (Gold)
  if (symbol.includes('XAU')) return 0.1
  // XAG (Silver)
  if (symbol.includes('XAG')) return 0.001
  // Indices
  if (symbol.includes('US30') || symbol.includes('NAS')) return 1
  // Standard forex
  return 0.0001
}

/**
 * Convert EST hour to UTC hour
 */
export function estToUtc(estHour: number): number {
  return (estHour + 5) % 24 // EST is UTC-5
}

/**
 * Convert UTC hour to EST hour
 */
export function utcToEst(utcHour: number): number {
  return (utcHour - 5 + 24) % 24
}

/**
 * Analyze candles for all ICT concepts and return a comprehensive result
 */
export function analyzeICTSetup(
  candles: Candle[],
  symbol: string,
  timeframe: Timeframe,
  config: StrategyConfig
) {
  const pipValue = getPipValue(symbol)

  const fvgs = detectFVGs(candles, config.fvgMinGapPips, pipValue)
  const swingPoints = detectSwingPoints(candles)
  const msss = detectMSS(candles, swingPoints, config.mssMinDisplacement, pipValue)
  const liquiditySweeps = detectLiquiditySweeps(candles, swingPoints, config.liquidityWickMin)
  const orderBlocks = detectOrderBlocks(candles, config.mssMinDisplacement, pipValue)

  const currentPrice = candles[candles.length - 1]?.close || 0
  const currentHourEST = utcToEst(new Date().getUTCHours())

  let signal: ICTSignal | null = null

  // Try Silver Bullet if within a window
  const sbWindow = isInSilverBulletWindow(config.sbWindows, currentHourEST)
  if (sbWindow && (config.strategyType === 'silver_bullet' || config.strategyType === 'hybrid')) {
    signal = generateSilverBulletSignal(fvgs, msss, currentPrice, symbol, timeframe, sbWindow, config)
  }

  // Try Market Maker Buy Model
  if (!signal && (config.strategyType === 'market_maker_buy' || config.strategyType === 'hybrid')) {
    signal = generateMMMBuySignal(liquiditySweeps, msss, fvgs, currentPrice, symbol, timeframe, config)
  }

  // Try Market Maker Sell Model
  if (!signal && (config.strategyType === 'market_maker_sell' || config.strategyType === 'hybrid')) {
    signal = generateMMMSellSignal(liquiditySweeps, msss, fvgs, currentPrice, symbol, timeframe, config)
  }

  return {
    fvgs,
    swingPoints,
    msss,
    liquiditySweeps,
    orderBlocks,
    signal,
    currentPrice,
    currentHourEST,
    inTradingWindow: currentHourEST >= config.tradingStartHour && currentHourEST < config.tradingEndHour,
  }
}
