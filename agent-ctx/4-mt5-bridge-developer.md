# Task 4 - MT5 Bridge Service Developer

## Task Summary
Create the MT5 Bridge mini-service at `mini-services/mt5-bridge/` with HTTP API endpoints for MetaTrader 5 interaction simulation.

## What Was Done

### Files Created
1. **`mini-services/mt5-bridge/package.json`** - Independent bun project with `bun --hot` dev script
2. **`mini-services/mt5-bridge/index.ts`** - Full HTTP API service using `Bun.serve()`

### API Endpoints (11 total, all on port 3004)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check with MT5 connection status |
| POST | /api/connect | Connect to MT5 with account credentials |
| POST | /api/disconnect | Disconnect from MT5 |
| GET | /api/account | Get account info (balance, equity, margin, etc.) |
| GET | /api/symbols | List 14 trading instruments |
| GET | /api/prices?symbol=X | Get current bid/ask with spread |
| GET | /api/candles?symbol=X&timeframe=M5&count=100 | Get OHLC candle data |
| POST | /api/trade/open | Open a new trade position |
| POST | /api/trade/close | Close a trade by ticket |
| GET | /api/positions | Get all open positions with P&L |
| GET | /api/history?from=X&to=Y | Get trade history with date filtering |

### Simulated Data
- **14 trading instruments**: EURUSD, GBPUSD, USDJPY, USDCHF, AUDUSD, NZDUSD, USDCAD, EURGBP, EURJPY, GBPJPY, XAUUSD, XAGUSD, US30, NAS100
- **Account**: $10,000 balance, ~$26 floating P&L, 100:1 leverage
- **3 seeded positions**: EURUSD buy, GBPUSD sell, USDJPY buy with ICT-themed comments
- **50 historical deals** spanning 180 days
- **Realistic prices**: Proper bid/ask spread, fluctuating mid-price
- **Candle data**: Trend-aware generation with sine/cosine cycles + noise

### Key Design Decisions
- Used native `Bun.serve()` (no external dependencies needed)
- `globalThis.__mt5Server` + `setInterval` to prevent GC and keep process alive
- Proper pip size / contract size calculations for JPY pairs, metals, and indices
- Auto-defaults for SL (30 pips) and TP (60 pips) when not specified
- CORS headers on all responses for cross-origin requests
- MT5 connection state gate: endpoints return 403 if not connected
- History deals span 180 days for realistic date-range querying

### Integration Note
The Next.js app should call endpoints using:
```
fetch('/api/health?XTransformPort=3004')
fetch('/api/account?XTransformPort=3004')
```

The Caddy gateway will route these to port 3004.

## Test Results
All 11 endpoints verified working correctly:
- Health check returns proper status
- Connect/disconnect cycle works
- Account info shows fluctuating equity/margin
- 14 symbols available with spread variation
- Prices have proper bid/ask spread
- Candles generate realistic OHLC data with trends
- Positions show live P&L
- Trade open/close lifecycle works with P&L calculation
- History returns 50 deals filterable by date range
