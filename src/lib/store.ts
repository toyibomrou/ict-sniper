/**
 * Zustand Store for ICT Trading Bot state management
 */

import { create } from 'zustand'

// ─── Types ──────────────────────────────────────────────────────────

export interface PriceData {
  symbol: string
  bid: number
  ask: number
  spread: number
  timestamp: number
}

export interface SignalData {
  id: string
  type: string
  symbol: string
  direction: string
  price: number
  confidence: number
  details?: string
  timestamp: number
}

export interface PositionData {
  id: string
  symbol: string
  direction: 'buy' | 'sell'
  entryPrice: number
  currentPrice: number
  stopLoss: number
  takeProfit: number
  lotSize: number
  pnl: number
  pnlPips: number
  signalType: string
  confidence: number
  openedAt: string
}

export interface MT5ConnectionState {
  connected: boolean
  accountNumber: string
  server: string
  balance: number
  equity: number
  leverage: number
  currency: string
}

export interface StrategyConfigState {
  id: string
  name: string
  strategyType: string
  pairs: string[]
  timeframe: string
  maxOpenPositions: number
  riskPerTrade: number
  maxDailyLoss: number
  slType: string
  tpType: string
  fixedRR: number
  isActive: boolean
}

export interface UserData {
  id: string
  email: string
  name: string
  isAuthenticated: boolean
  activeDevices: number
  maxDevices: number
}

// ─── Store ──────────────────────────────────────────────────────────

interface TradingStore {
  // User
  user: UserData | null
  setUser: (user: UserData | null) => void

  // MT5 Connection
  mt5: MT5ConnectionState
  setMT5: (mt5: Partial<MT5ConnectionState>) => void

  // Prices
  prices: Map<string, PriceData>
  updatePrice: (price: PriceData) => void

  // Signals
  signals: SignalData[]
  addSignal: (signal: SignalData) => void
  clearSignals: () => void

  // Positions
  positions: PositionData[]
  addPosition: (position: PositionData) => void
  updatePosition: (id: string, updates: Partial<PositionData>) => void
  removePosition: (id: string) => void

  // Strategy
  strategy: StrategyConfigState | null
  setStrategy: (strategy: StrategyConfigState) => void

  // UI State
  isStrategyRunning: boolean
  setStrategyRunning: (running: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  wsConnected: boolean
  setWsConnected: (connected: boolean) => void

  // P&L tracking
  dailyPnl: number
  totalPnl: number
  winRate: number
  totalTrades: number
  winningTrades: number
  updatePnlStats: (closedPnl: number) => void
}

export const useTradingStore = create<TradingStore>((set) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),

  // MT5 Connection
  mt5: {
    connected: false,
    accountNumber: '',
    server: '',
    balance: 0,
    equity: 0,
    leverage: 0,
    currency: 'USD',
  },
  setMT5: (mt5) => set((state) => ({ mt5: { ...state.mt5, ...mt5 } })),

  // Prices
  prices: new Map(),
  updatePrice: (price) =>
    set((state) => {
      const newPrices = new Map(state.prices)
      newPrices.set(price.symbol, price)
      return { prices: newPrices }
    }),

  // Signals
  signals: [],
  addSignal: (signal) =>
    set((state) => ({
      signals: [signal, ...state.signals].slice(0, 50), // Keep last 50
    })),
  clearSignals: () => set({ signals: [] }),

  // Positions
  positions: [],
  addPosition: (position) =>
    set((state) => ({
      positions: [...state.positions, position],
    })),
  updatePosition: (id, updates) =>
    set((state) => ({
      positions: state.positions.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  removePosition: (id) =>
    set((state) => ({
      positions: state.positions.filter((p) => p.id !== id),
    })),

  // Strategy
  strategy: null,
  setStrategy: (strategy) => set({ strategy }),

  // UI State
  isStrategyRunning: false,
  setStrategyRunning: (running) => set({ isStrategyRunning: running }),
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),

  // P&L tracking
  dailyPnl: 0,
  totalPnl: 0,
  winRate: 0,
  totalTrades: 0,
  winningTrades: 0,
  updatePnlStats: (closedPnl) =>
    set((state) => {
      const newTotalTrades = state.totalTrades + 1
      const newWinningTrades = state.winningTrades + (closedPnl > 0 ? 1 : 0)
      return {
        dailyPnl: state.dailyPnl + closedPnl,
        totalPnl: state.totalPnl + closedPnl,
        totalTrades: newTotalTrades,
        winningTrades: newWinningTrades,
        winRate: newTotalTrades > 0 ? (newWinningTrades / newTotalTrades) * 100 : 0,
      }
    }),
}))
