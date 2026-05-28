/**
 * MT5 Bridge Mini-Service
 * Simulates a MetaTrader 5 bridge for the ICT Trading Bot.
 * In production, this would use the MetaTrader5 Python package.
 * For this demo, all MT5 responses are simulated with realistic data.
 */

const PORT = 3004;

// ─── State ──────────────────────────────────────────────────────────────────

let mt5Connected = false;
let connectionInfo: {
  accountNumber: string;
  password: string;
  server: string;
  path?: string;
} | null = null;

let nextTicket = 100001;
const openPositions: Map<number, Position> = new Map();

// ─── Types ──────────────────────────────────────────────────────────────────

interface Position {
  ticket: number;
  symbol: string;
  type: "buy" | "sell";
  lotSize: number;
  openPrice: number;
  sl: number;
  tp: number;
  pnl: number;
  comment: string;
  magic: number;
  openTime: Date;
}

interface SymbolInfo {
  name: string;
  description: string;
  digits: number;
  point: number;
  spread: number;
  tradeMode: string;
  bid: number;
  ask: number;
}

// ─── Simulated Data ─────────────────────────────────────────────────────────

const SYMBOLS: SymbolInfo[] = [
  { name: "EURUSD", description: "Euro vs US Dollar", digits: 5, point: 0.00001, spread: 12, tradeMode: "full", bid: 1.08542, ask: 1.08554 },
  { name: "GBPUSD", description: "British Pound vs US Dollar", digits: 5, point: 0.00001, spread: 15, tradeMode: "full", bid: 1.27156, ask: 1.27171 },
  { name: "USDJPY", description: "US Dollar vs Japanese Yen", digits: 3, point: 0.001, spread: 10, tradeMode: "full", bid: 149.852, ask: 149.862 },
  { name: "USDCHF", description: "US Dollar vs Swiss Franc", digits: 5, point: 0.00001, spread: 14, tradeMode: "full", bid: 0.87945, ask: 0.87959 },
  { name: "AUDUSD", description: "Australian Dollar vs US Dollar", digits: 5, point: 0.00001, spread: 13, tradeMode: "full", bid: 0.65423, ask: 0.65436 },
  { name: "NZDUSD", description: "New Zealand Dollar vs US Dollar", digits: 5, point: 0.00001, spread: 18, tradeMode: "full", bid: 0.61287, ask: 0.61305 },
  { name: "USDCAD", description: "US Dollar vs Canadian Dollar", digits: 5, point: 0.00001, spread: 16, tradeMode: "full", bid: 1.35672, ask: 1.35688 },
  { name: "EURGBP", description: "Euro vs British Pound", digits: 5, point: 0.00001, spread: 20, tradeMode: "full", bid: 0.85371, ask: 0.85391 },
  { name: "EURJPY", description: "Euro vs Japanese Yen", digits: 3, point: 0.001, spread: 18, tradeMode: "full", bid: 162.615, ask: 162.633 },
  { name: "GBPJPY", description: "British Pound vs Japanese Yen", digits: 3, point: 0.001, spread: 22, tradeMode: "full", bid: 190.528, ask: 190.550 },
  { name: "XAUUSD", description: "Gold vs US Dollar", digits: 2, point: 0.01, spread: 25, tradeMode: "full", bid: 2341.50, ask: 2341.75 },
  { name: "XAGUSD", description: "Silver vs US Dollar", digits: 3, point: 0.001, spread: 30, tradeMode: "full", bid: 27.854, ask: 27.884 },
  { name: "US30", description: "US Wall Street 30 Index", digits: 2, point: 0.01, spread: 40, tradeMode: "full", bid: 39245.50, ask: 39249.50 },
  { name: "NAS100", description: "US Tech 100 Index", digits: 2, point: 0.01, spread: 55, tradeMode: "full", bid: 18325.75, ask: 18331.25 },
];

const ACCOUNT_INFO = {
  balance: 10000.0,
  equity: 10023.45,
  margin: 1245.60,
  freeMargin: 8777.85,
  leverage: 100,
  currency: "USD",
  profit: 23.45,
  name: "ICT Demo Trading Account",
};

const HISTORY_DEALS = generateHistoryDeals();

// ─── Seed some open positions ───────────────────────────────────────────────

function seedPositions() {
  const seeds: Omit<Position, "pnl" | "openTime">[] = [
    { ticket: nextTicket++, symbol: "EURUSD", type: "buy", lotSize: 0.10, openPrice: 1.08495, sl: 1.08200, tp: 1.08800, comment: "ICT Silver Bullet", magic: 123456 },
    { ticket: nextTicket++, symbol: "GBPUSD", type: "sell", lotSize: 0.05, openPrice: 1.27280, sl: 1.27580, tp: 1.26980, comment: "MMM Sell Model", magic: 123456 },
    { ticket: nextTicket++, symbol: "USDJPY", type: "buy", lotSize: 0.08, openPrice: 149.650, sl: 149.350, tp: 150.150, comment: "FVG Fill", magic: 789012 },
  ];

  for (const seed of seeds) {
    const sym = SYMBOLS.find((s) => s.name === seed.symbol)!;
    const currentPrice = seed.type === "buy" ? sym.bid : sym.ask;
    const pnl = seed.type === "buy"
      ? (currentPrice - seed.openPrice) * seed.lotSize * (seed.symbol.includes("JPY") ? 1000 : 100000)
      : (seed.openPrice - currentPrice) * seed.lotSize * (seed.symbol.includes("JPY") ? 1000 : 100000);

    openPositions.set(seed.ticket, {
      ...seed,
      pnl: Math.round(pnl * 100) / 100,
      openTime: new Date(Date.now() - Math.random() * 3600000 * 3),
    });
  }
}

seedPositions();

// ─── Helper Functions ───────────────────────────────────────────────────────

function getSymbolInfo(symbol: string): SymbolInfo | undefined {
  return SYMBOLS.find((s) => s.name === symbol);
}

function generateCandles(symbol: string, timeframe: string, count: number) {
  const sym = SYMBOLS.find((s) => s.name === symbol);
  if (!sym) return [];

  const basePrice = sym.bid;
  const candles: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    tickVolume: number;
  }> = [];

  // Timeframe to ms mapping
  const tfMs: Record<string, number> = {
    M1: 60000,
    M5: 300000,
    M15: 900000,
    M30: 1800000,
    H1: 3600000,
    H4: 14400000,
    D1: 86400000,
  };
  const interval = tfMs[timeframe] || 300000;

  let price = basePrice - (count * 0.0003); // start slightly lower to create a trend
  const now = Date.now();

  // Determine pip size based on symbol
  const isJPY = symbol.includes("JPY");
  const isIndexOrMetal = ["XAUUSD", "XAGUSD", "US30", "NAS100"].includes(symbol);
  const pipMultiplier = isJPY ? 0.01 : isIndexOrMetal ? 1.0 : 0.0001;

  for (let i = 0; i < count; i++) {
    // Create realistic price movement with trends and ranges
    const trendPhase = Math.sin(i / 20) * 0.5 + Math.cos(i / 50) * 0.3;
    const noise = (Math.random() - 0.5) * 2;
    const volatility = pipMultiplier * (3 + Math.random() * 8);

    const move = (trendPhase + noise) * volatility;
    const open = price;
    const close = open + move;
    const wickUp = Math.random() * volatility * 0.8;
    const wickDown = Math.random() * volatility * 0.8;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;

    const precision = isJPY ? 3 : isIndexOrMetal ? 2 : 5;

    candles.push({
      time: new Date(now - (count - i) * interval).toISOString(),
      open: parseFloat(open.toFixed(precision)),
      high: parseFloat(high.toFixed(precision)),
      low: parseFloat(low.toFixed(precision)),
      close: parseFloat(close.toFixed(precision)),
      tickVolume: Math.floor(50 + Math.random() * 450),
    });

    price = close;
  }

  return candles;
}

function generateHistoryDeals() {
  const deals: Array<{
    ticket: number;
    symbol: string;
    type: string;
    volume: number;
    price: number;
    pnl: number;
    time: string;
  }> = [];

  const dealSymbols = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "XAUUSD"];
  let ticket = 900001;

  for (let i = 0; i < 50; i++) {
    const symbol = dealSymbols[Math.floor(Math.random() * dealSymbols.length)];
    const sym = SYMBOLS.find((s) => s.name === symbol)!;
    const isBuy = Math.random() > 0.5;
    const volume = parseFloat((0.01 + Math.random() * 0.19).toFixed(2));
    const isJPY = symbol.includes("JPY");
    const isMetal = ["XAUUSD", "XAGUSD"].includes(symbol);
    const pipSize = isJPY ? 0.01 : isMetal ? 0.1 : 0.0001;
    const pips = (Math.random() * 40 - 10); // range from -10 to +30 pips
    const pnl = pips * pipSize * volume * (isJPY ? 1000 : isMetal ? 100 : 100000);

    const basePrice = isBuy ? sym.bid : sym.ask;
    const priceOffset = (Math.random() - 0.5) * pipSize * 100;

    // Span deals over the last 180 days for more realistic history
    const dayOffset = Math.floor(Math.random() * 180);
    const hourOffset = Math.floor(Math.random() * 24);

    deals.push({
      ticket: ticket++,
      symbol,
      type: isBuy ? "buy" : "sell",
      volume,
      price: parseFloat((basePrice + priceOffset).toFixed(isJPY ? 3 : isMetal ? 2 : 5)),
      pnl: parseFloat(pnl.toFixed(2)),
      time: new Date(Date.now() - dayOffset * 86400000 - hourOffset * 3600000).toISOString(),
    });
  }

  return deals.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

function fluctuatePrice(sym: SymbolInfo): { bid: number; ask: number } {
  const isJPY = sym.name.includes("JPY");
  const isIndexOrMetal = ["XAUUSD", "XAGUSD", "US30", "NAS100"].includes(sym.name);
  const precision = isJPY ? 3 : isIndexOrMetal ? 2 : 5;

  // Fluctuate the mid price
  const mid = (sym.bid + sym.ask) / 2;
  const fluctuation = (Math.random() - 0.5) * (isJPY ? 0.03 : isIndexOrMetal ? 0.5 : 0.0002);
  const newMid = mid + fluctuation;

  // Calculate spread in price terms from the point value
  const spreadPips = sym.spread + Math.floor(Math.random() * 3 - 1); // slight variation
  const halfSpread = (spreadPips * sym.point) / 2;

  const bid = parseFloat((newMid - halfSpread).toFixed(precision));
  const ask = parseFloat((newMid + halfSpread).toFixed(precision));

  return { bid, ask };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

// ─── HTTP Server ────────────────────────────────────────────────────────────

const server = Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    try {
      // ─── Health Check ─────────────────────────────────────────────
      if (path === "/api/health" && method === "GET") {
        return jsonResponse({
          status: "ok",
          mt5Connected,
          version: "5.0.45-build-2361",
        });
      }

      // ─── Connect ──────────────────────────────────────────────────
      if (path === "/api/connect" && method === "POST") {
        const body = (await req.json()) as {
          accountNumber: string;
          password: string;
          server: string;
          path?: string;
        };

        if (!body.accountNumber || !body.password || !body.server) {
          return jsonResponse(
            { success: false, error: "Missing required fields: accountNumber, password, server" },
            400
          );
        }

        // Simulate connection (always succeeds in demo)
        mt5Connected = true;
        connectionInfo = body;

        // Update equity with slight fluctuation
        ACCOUNT_INFO.equity = parseFloat((ACCOUNT_INFO.balance + (Math.random() - 0.3) * 50).toFixed(2));
        ACCOUNT_INFO.profit = parseFloat((ACCOUNT_INFO.equity - ACCOUNT_INFO.balance).toFixed(2));

        return jsonResponse({
          success: true,
          accountInfo: {
            balance: ACCOUNT_INFO.balance,
            equity: ACCOUNT_INFO.equity,
            leverage: ACCOUNT_INFO.leverage,
            currency: ACCOUNT_INFO.currency,
            name: ACCOUNT_INFO.name,
          },
        });
      }

      // ─── Disconnect ───────────────────────────────────────────────
      if (path === "/api/disconnect" && method === "POST") {
        mt5Connected = false;
        connectionInfo = null;
        return jsonResponse({ success: true });
      }

      // ─── Account Info ─────────────────────────────────────────────
      if (path === "/api/account" && method === "GET") {
        if (!mt5Connected) {
          return jsonResponse({ error: "MT5 not connected" }, 403);
        }

        // Simulate equity/margin fluctuation
        const totalPnl = Array.from(openPositions.values()).reduce((sum, p) => sum + p.pnl, 0);
        ACCOUNT_INFO.equity = parseFloat((ACCOUNT_INFO.balance + totalPnl).toFixed(2));
        ACCOUNT_INFO.profit = parseFloat(totalPnl.toFixed(2));
        ACCOUNT_INFO.margin = parseFloat((1245 + Math.random() * 50).toFixed(2));
        ACCOUNT_INFO.freeMargin = parseFloat((ACCOUNT_INFO.equity - ACCOUNT_INFO.margin).toFixed(2));

        return jsonResponse({
          balance: ACCOUNT_INFO.balance,
          equity: ACCOUNT_INFO.equity,
          margin: ACCOUNT_INFO.margin,
          freeMargin: ACCOUNT_INFO.freeMargin,
          leverage: ACCOUNT_INFO.leverage,
          currency: ACCOUNT_INFO.currency,
          profit: ACCOUNT_INFO.profit,
          openPositions: openPositions.size,
        });
      }

      // ─── Symbols ──────────────────────────────────────────────────
      if (path === "/api/symbols" && method === "GET") {
        if (!mt5Connected) {
          return jsonResponse({ error: "MT5 not connected" }, 403);
        }

        return jsonResponse({
          symbols: SYMBOLS.map((s) => ({
            name: s.name,
            description: s.description,
            digits: s.digits,
            point: s.point,
            spread: s.spread + Math.floor(Math.random() * 5 - 2),
            tradeMode: s.tradeMode,
          })),
        });
      }

      // ─── Prices ───────────────────────────────────────────────────
      if (path === "/api/prices" && method === "GET") {
        if (!mt5Connected) {
          return jsonResponse({ error: "MT5 not connected" }, 403);
        }

        const symbol = url.searchParams.get("symbol");
        if (!symbol) {
          return jsonResponse({ error: "Missing 'symbol' query parameter" }, 400);
        }

        const sym = getSymbolInfo(symbol);
        if (!sym) {
          return jsonResponse({ error: `Symbol '${symbol}' not found` }, 404);
        }

        // Add realistic price fluctuation
        const { bid, ask } = fluctuatePrice(sym);
        const spread = parseFloat(((ask - bid) / sym.point).toFixed(1));

        return jsonResponse({
          symbol,
          bid,
          ask,
          spread,
          time: new Date().toISOString(),
        });
      }

      // ─── Candles ──────────────────────────────────────────────────
      if (path === "/api/candles" && method === "GET") {
        if (!mt5Connected) {
          return jsonResponse({ error: "MT5 not connected" }, 403);
        }

        const symbol = url.searchParams.get("symbol") || "EURUSD";
        const timeframe = url.searchParams.get("timeframe") || "M5";
        const count = parseInt(url.searchParams.get("count") || "100", 10);

        if (count < 1 || count > 1000) {
          return jsonResponse({ error: "Count must be between 1 and 1000" }, 400);
        }

        const sym = getSymbolInfo(symbol);
        if (!sym) {
          return jsonResponse({ error: `Symbol '${symbol}' not found` }, 404);
        }

        const candles = generateCandles(symbol, timeframe, count);
        return jsonResponse(candles);
      }

      // ─── Open Trade ───────────────────────────────────────────────
      if (path === "/api/trade/open" && method === "POST") {
        if (!mt5Connected) {
          return jsonResponse({ error: "MT5 not connected" }, 403);
        }

        const body = (await req.json()) as {
          symbol: string;
          direction: "buy" | "sell";
          lotSize: number;
          sl?: number;
          tp?: number;
          comment?: string;
          magic?: number;
        };

        if (!body.symbol || !body.direction || !body.lotSize) {
          return jsonResponse(
            { success: false, error: "Missing required fields: symbol, direction, lotSize" },
            400
          );
        }

        const sym = getSymbolInfo(body.symbol);
        if (!sym) {
          return jsonResponse(
            { success: false, error: `Symbol '${body.symbol}' not found` },
            404
          );
        }

        if (!["buy", "sell"].includes(body.direction)) {
          return jsonResponse(
            { success: false, error: "Direction must be 'buy' or 'sell'" },
            400
          );
        }

        const isJPY = body.symbol.includes("JPY");
        const isIndexOrMetal = ["XAUUSD", "XAGUSD", "US30", "NAS100"].includes(body.symbol);
        const pipSize = isJPY ? 0.01 : isIndexOrMetal ? 1.0 : 0.0001;

        const openPrice = body.direction === "buy" ? sym.ask : sym.bid;
        const defaultSl = body.direction === "buy"
          ? openPrice - pipSize * 30
          : openPrice + pipSize * 30;
        const defaultTp = body.direction === "buy"
          ? openPrice + pipSize * 60
          : openPrice - pipSize * 60;

        const ticket = nextTicket++;
        const position: Position = {
          ticket,
          symbol: body.symbol,
          type: body.direction,
          lotSize: body.lotSize,
          openPrice: parseFloat(openPrice.toFixed(isJPY ? 3 : isIndexOrMetal ? 2 : 5)),
          sl: body.sl ?? parseFloat(defaultSl.toFixed(isJPY ? 3 : isIndexOrMetal ? 2 : 5)),
          tp: body.tp ?? parseFloat(defaultTp.toFixed(isJPY ? 3 : isIndexOrMetal ? 2 : 5)),
          pnl: 0,
          comment: body.comment || "",
          magic: body.magic || 0,
          openTime: new Date(),
        };

        openPositions.set(ticket, position);

        return jsonResponse({
          success: true,
          ticket,
          price: position.openPrice,
        });
      }

      // ─── Close Trade ──────────────────────────────────────────────
      if (path === "/api/trade/close" && method === "POST") {
        if (!mt5Connected) {
          return jsonResponse({ error: "MT5 not connected" }, 403);
        }

        const body = (await req.json()) as { ticket: number };
        if (!body.ticket) {
          return jsonResponse({ success: false, error: "Missing 'ticket' field" }, 400);
        }

        const position = openPositions.get(body.ticket);
        if (!position) {
          return jsonResponse(
            { success: false, error: `Position with ticket ${body.ticket} not found` },
            404
          );
        }

        const sym = getSymbolInfo(position.symbol);
        const closePrice = position.type === "buy" ? sym!.bid : sym!.ask;

        // Calculate final PnL
        const isJPY = position.symbol.includes("JPY");
        const isIndexOrMetal = ["XAUUSD", "XAGUSD", "US30", "NAS100"].includes(position.symbol);
        const contractSize = isJPY ? 1000 : isIndexOrMetal ? (position.symbol === "XAUUSD" ? 100 : position.symbol === "US30" || position.symbol === "NAS100" ? 1 : 5000) : 100000;

        const pnl = position.type === "buy"
          ? (closePrice - position.openPrice) * position.lotSize * contractSize
          : (position.openPrice - closePrice) * position.lotSize * contractSize;

        // Update account balance
        ACCOUNT_INFO.balance = parseFloat((ACCOUNT_INFO.balance + pnl).toFixed(2));

        openPositions.delete(body.ticket);

        return jsonResponse({
          success: true,
          pnl: parseFloat(pnl.toFixed(2)),
          price: closePrice,
        });
      }

      // ─── Open Positions ───────────────────────────────────────────
      if (path === "/api/positions" && method === "GET") {
        if (!mt5Connected) {
          return jsonResponse({ error: "MT5 not connected" }, 403);
        }

        // Update PnL for all positions with price fluctuation
        const positions = Array.from(openPositions.values()).map((pos) => {
          const sym = getSymbolInfo(pos.symbol);
          if (sym) {
            const currentPrice = pos.type === "buy" ? sym.bid : sym.ask;
            const isJPY = pos.symbol.includes("JPY");
            const isIndexOrMetal = ["XAUUSD", "XAGUSD", "US30", "NAS100"].includes(pos.symbol);
            const contractSize = isJPY ? 1000 : isIndexOrMetal ? (pos.symbol === "XAUUSD" ? 100 : pos.symbol === "US30" || pos.symbol === "NAS100" ? 1 : 5000) : 100000;

            pos.pnl = parseFloat(
              (pos.type === "buy"
                ? (currentPrice - pos.openPrice) * pos.lotSize * contractSize
                : (pos.openPrice - currentPrice) * pos.lotSize * contractSize
              ).toFixed(2)
            );
          }

          return {
            ticket: pos.ticket,
            symbol: pos.symbol,
            type: pos.type,
            lotSize: pos.lotSize,
            openPrice: pos.openPrice,
            sl: pos.sl,
            tp: pos.tp,
            pnl: pos.pnl,
            comment: pos.comment,
          };
        });

        return jsonResponse({ positions });
      }

      // ─── Trade History ────────────────────────────────────────────
      if (path === "/api/history" && method === "GET") {
        if (!mt5Connected) {
          return jsonResponse({ error: "MT5 not connected" }, 403);
        }

        const from = url.searchParams.get("from");
        const to = url.searchParams.get("to");

        let filteredDeals = HISTORY_DEALS;

        if (from) {
          const fromDate = new Date(from).getTime();
          filteredDeals = filteredDeals.filter((d) => new Date(d.time).getTime() >= fromDate);
        }
        if (to) {
          const toDate = new Date(to).getTime();
          filteredDeals = filteredDeals.filter((d) => new Date(d.time).getTime() <= toDate);
        }

        return jsonResponse({ deals: filteredDeals });
      }

      // ─── 404 ──────────────────────────────────────────────────────
      return jsonResponse({ error: "Not found" }, 404);
    } catch (err) {
      console.error("Request error:", err);
      return jsonResponse({ error: "Internal server error" }, 500);
    }
  },
});

// Prevent garbage collection of the server
globalThis.__mt5Server = server;

// Keep-alive interval to ensure the process stays running
setInterval(() => {
  // heartbeat
}, 30000);

console.log(`🔄 MT5 Bridge service running on port ${PORT}`);
console.log(`   Health:   GET  /api/health`);
console.log(`   Connect:  POST /api/connect`);
console.log(`   Account:  GET  /api/account`);
console.log(`   Symbols:  GET  /api/symbols`);
console.log(`   Prices:   GET  /api/prices?symbol=EURUSD`);
console.log(`   Candles:  GET  /api/candles?symbol=EURUSD&timeframe=M5&count=100`);
console.log(`   Open:     POST /api/trade/open`);
console.log(`   Close:    POST /api/trade/close`);
console.log(`   Positions:GET  /api/positions`);
console.log(`   History:  GET  /api/history?from=2024-01-01&to=2024-12-31`);

// Declare global type
declare global {
  var __mt5Server: typeof server;
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("MT5 Bridge: Received SIGTERM, shutting down...");
  server.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("MT5 Bridge: Received SIGINT, shutting down...");
  server.stop();
  process.exit(0);
});
