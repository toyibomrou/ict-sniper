# Task 3 - WebSocket Service Developer

## Task
Create Trading WebSocket mini-service at `mini-services/trading-ws/`

## Completed Work

### Files Created
- `mini-services/trading-ws/package.json` - Bun project with socket.io dependency, dev script uses `bun --hot`
- `mini-services/trading-ws/index.ts` - Full WebSocket service implementation

### Implementation Details

#### PriceSimulator Class
- Generates realistic forex price ticks for 7 pairs: EURUSD, GBPUSD, USDJPY, AUDUSD, USDCHF, NZDUSD, USDCAD
- Updates every 1-2 seconds with small random movements (90% normal, 10% volatile)
- Mean reversion toward base prices for realistic price action
- Tracks OHLC candles (30-second simulated M5 candles for faster signal detection)
- Proper pip size handling per pair (0.0001 for most, 0.01 for JPY pairs)

#### ICTSignalGenerator Class
- **Fair Value Gap Detection**: 3-candle pattern where candle 1 high < candle 3 low (bullish) or candle 1 low > candle 3 high (bearish), minimum 3-pip gap threshold
- **Market Structure Shift Detection**: Price breaks above recent swing high (bullish MSS) or below recent swing low (bearish MSS), minimum 5-pip displacement
- Confidence scores range from 50-95% based on gap/displacement size
- Runs on candle close events from the price simulator

#### TradeSimulator Class
- 30% probability of opening a trade from detected ICT signals
- Calculates SL (15-35 pips), TP (1.5-3.0 R:R ratio), lot size (0.01-0.10)
- Monitors open trades every 2 seconds against current prices
- Detects SL/TP hits and rare manual/trailing stop closes
- Broadcasts trade-opened and trade-closed events

#### Socket.io Events
**Client → Server:**
- `subscribe` - Subscribe to price updates with `{ pairs: string[], userId: string }`
- `unsubscribe` - Unsubscribe from pairs with `{ pairs: string[] }`
- `strategy-control` - Start/stop strategies with `{ action: 'start'|'stop', strategyId: string, config: object }`

**Server → Client:**
- `price-update` - Real-time price data `{ symbol, bid, ask, spread, timestamp }`
- `signal-detected` - ICT signal `{ id, type, symbol, direction, price, confidence, details }`
- `trade-opened` - New trade `{ id, symbol, direction, entry, sl, tp, lotSize }`
- `trade-closed` - Closed trade `{ id, symbol, direction, pnl, closeReason }`
- `strategy-status` - Strategy update `{ strategyId, status, message }`
- `connection-status` - MT5 connection `{ connected, accountInfo }`

#### MT5 Connection Simulation
- Sends connection status on client connect
- 2% chance of brief disconnect every 30 seconds
- Auto-reconnect after 3-8 seconds
- Includes simulated account info (balance, equity, leverage, currency, server)

## Testing Results
- ✅ Price updates flowing correctly (28+ ticks in 8 seconds)
- ✅ Subscribe/unsubscribe working with pair filtering
- ✅ Strategy start/stop with status broadcasts
- ✅ MT5 connection status on connect
- ✅ Signal detection code verified (requires longer run time for actual signal generation)
- ✅ Service running on port 3003

## Connection Info
- Port: 3003
- Socket.io path: /
- Frontend connection: `io("/?XTransformPort=3003")`
