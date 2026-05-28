'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTradingStore } from '@/lib/store'
import { useTradingSocket } from '@/hooks/use-trading-socket'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, TrendingUp, TrendingDown, Wifi, WifiOff, Settings, Shield,
  Play, Square, BarChart3, Signal, MonitorSmartphone, BookOpen,
  DollarSign, Target, Clock, ChevronRight, Zap, AlertTriangle,
  CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, RefreshCw,
  LogOut, User, Key, Cpu, Globe, Layers, Eye
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// ─── Login Component ─────────────────────────────────────────────────

function LoginScreen() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUser } = useTradingStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const body: any = { email, password }
      if (isRegister) body.name = name

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Authentication failed')
        return
      }

      localStorage.setItem('token', data.token)
      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        isAuthenticated: true,
        activeDevices: data.deviceCount || 1,
        maxDevices: 2,
      })
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"
          >
            <Zap className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">ICT Sniper</h1>
          <p className="text-slate-400 mt-2">Inner Circle Trader Strategy Bot</p>
        </div>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isRegister ? 'Register for a new license' : 'Sign in to your trading dashboard'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Trader name"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-slate-300">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@example.com"
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-red-400 text-sm"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
              >
                {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setError('') }}
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                </button>
              </div>
            </form>

            <div className="mt-6 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Max 2 devices per license • 256-bit encryption</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ─── Dashboard Header ─────────────────────────────────────────────────

function DashboardHeader() {
  const { mt5, wsConnected, isStrategyRunning, user, setUser } = useTradingStore()
  const { connect, disconnect } = useTradingSocket()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white hidden sm:block">ICT Sniper</h1>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Badge
              variant={wsConnected ? 'default' : 'destructive'}
              className={`text-xs ${wsConnected ? 'bg-emerald-600' : 'bg-red-600'}`}
            >
              {wsConnected ? (
                <><Wifi className="w-3 h-3 mr-1" />Live</>
              ) : (
                <><WifiOff className="w-3 h-3 mr-1" />Offline</>
              )}
            </Badge>
            <Badge
              variant={mt5.connected ? 'default' : 'secondary'}
              className={`text-xs ${mt5.connected ? 'bg-emerald-600' : 'bg-slate-700'}`}
            >
              <Cpu className="w-3 h-3 mr-1" />
              {mt5.connected ? 'MT5 Connected' : 'MT5 Offline'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={wsConnected ? 'destructive' : 'default'}
            onClick={wsConnected ? disconnect : connect}
            className={wsConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
          >
            {wsConnected ? 'Disconnect' : 'Connect'}
          </Button>

          <div className="flex items-center gap-2 ml-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">{user?.name || 'Trader'}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-white"
              onClick={() => {
                localStorage.removeItem('token')
                setUser(null)
              }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

// ─── Account Overview Cards ────────────────────────────────────────────

function AccountOverview() {
  const { mt5, dailyPnl, winRate, totalTrades, positions, isStrategyRunning, setStrategyRunning } = useTradingStore()
  const { startStrategy, stopStrategy } = useTradingSocket()

  const toggleStrategy = () => {
    if (isStrategyRunning) {
      stopStrategy('default')
      setStrategyRunning(false)
    } else {
      startStrategy('default', {})
      setStrategyRunning(true)
    }
  }

  const stats = [
    {
      label: 'Balance',
      value: `$${(mt5.balance || 10000).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'from-emerald-500/20 to-teal-500/20',
    },
    {
      label: 'Equity',
      value: `$${(mt5.equity || 10050).toLocaleString()}`,
      icon: TrendingUp,
      color: dailyPnl >= 0 ? 'text-emerald-400' : 'text-red-400',
      bg: dailyPnl >= 0 ? 'from-emerald-500/20 to-teal-500/20' : 'from-red-500/20 to-rose-500/20',
    },
    {
      label: "Today's P&L",
      value: `${dailyPnl >= 0 ? '+' : ''}$${dailyPnl.toFixed(2)}`,
      icon: dailyPnl >= 0 ? ArrowUpRight : ArrowDownRight,
      color: dailyPnl >= 0 ? 'text-emerald-400' : 'text-red-400',
      bg: dailyPnl >= 0 ? 'from-emerald-500/20 to-teal-500/20' : 'from-red-500/20 to-rose-500/20',
    },
    {
      label: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      color: winRate >= 60 ? 'text-emerald-400' : 'text-amber-400',
      bg: winRate >= 60 ? 'from-emerald-500/20 to-teal-500/20' : 'from-amber-500/20 to-orange-500/20',
      subtitle: `${totalTrades} trades`,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="col-span-2 lg:col-span-4"
      >
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isStrategyRunning ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                {isStrategyRunning ? (
                  <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {isStrategyRunning ? 'ICT Strategy Running' : 'Strategy Stopped'}
                </p>
                <p className="text-xs text-slate-400">
                  {isStrategyRunning
                    ? `Active positions: ${positions.length} • Monitoring pairs`
                    : 'Start the strategy to begin scanning for ICT setups'}
                </p>
              </div>
            </div>
            <Button
              onClick={toggleStrategy}
              className={isStrategyRunning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
              }
            >
              {isStrategyRunning ? (
                <><Square className="w-4 h-4 mr-2" />Stop</>
              ) : (
                <><Play className="w-4 h-4 mr-2" />Start Strategy</>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ─── Price Ticker ──────────────────────────────────────────────────────

function PriceTicker() {
  const { prices } = useTradingStore()
  const priceList = Array.from(prices.values())

  if (priceList.length === 0) return null

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-2 px-4 pt-3">
        <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" /> Live Prices
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-16">
          <div className="flex gap-3 px-2">
            {priceList.map((p) => {
              const spread = p.ask - p.bid
              const isJPY = p.symbol.includes('JPY')
              const decimals = isJPY ? 3 : 5
              return (
                <div key={p.symbol} className="flex items-center gap-2 px-2 py-1 rounded-md bg-slate-800/50 min-w-[140px]">
                  <span className="text-xs font-medium text-slate-300">{p.symbol}</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-emerald-400 font-mono">{p.bid.toFixed(decimals)}</span>
                    <span className="text-xs text-red-400 font-mono">{p.ask.toFixed(decimals)}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-slate-700 text-slate-400">
                    {spread.toFixed(isJPY ? 3 : 5)}
                  </Badge>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ─── Open Positions Table ──────────────────────────────────────────────

function PositionsPanel() {
  const { positions, removePosition, updatePnlStats } = useTradingStore()

  const handleClose = (id: string) => {
    const pos = positions.find(p => p.id === id)
    if (pos) {
      updatePnlStats(pos.pnl)
    }
    removePosition(id)
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-2 px-4 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Open Positions
            <Badge variant="secondary" className="text-xs bg-slate-800">{positions.length}</Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        {positions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No open positions</p>
            <p className="text-xs mt-1">Start the strategy to begin trading</p>
          </div>
        ) : (
          <ScrollArea className="max-h-72">
            <div className="space-y-2 px-1">
              {positions.map((pos) => (
                <motion.div
                  key={pos.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      pos.direction === 'buy' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                    }`}>
                      {pos.direction === 'buy' ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{pos.symbol}</span>
                        <Badge
                          className={`text-[10px] ${
                            pos.direction === 'buy'
                              ? 'bg-emerald-600/30 text-emerald-400 border-emerald-600/30'
                              : 'bg-red-600/30 text-red-400 border-red-600/30'
                          }`}
                        >
                          {pos.direction.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex gap-3 text-xs text-slate-400 mt-1">
                        <span>Entry: {pos.entryPrice.toFixed(5)}</span>
                        <span>Lot: {pos.lotSize}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-sm font-medium ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                      </p>
                      <p className={`text-xs ${pos.pnlPips >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                        {pos.pnlPips >= 0 ? '+' : ''}{pos.pnlPips.toFixed(1)} pips
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                      onClick={() => handleClose(pos.id)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

// ─── ICT Signal Feed ───────────────────────────────────────────────────

function SignalFeed() {
  const { signals } = useTradingStore()

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'fvg': return <Eye className="w-4 h-4 text-amber-400" />
      case 'mss': return <Activity className="w-4 h-4 text-purple-400" />
      case 'liquidity_sweep': return <AlertTriangle className="w-4 h-4 text-rose-400" />
      case 'silver_bullet': return <Zap className="w-4 h-4 text-emerald-400" />
      case 'mmm_buy': return <TrendingUp className="w-4 h-4 text-emerald-400" />
      case 'mmm_sell': return <TrendingDown className="w-4 h-4 text-red-400" />
      default: return <Signal className="w-4 h-4 text-blue-400" />
    }
  }

  const getSignalLabel = (type: string) => {
    switch (type) {
      case 'fvg': return 'Fair Value Gap'
      case 'mss': return 'Market Structure Shift'
      case 'liquidity_sweep': return 'Liquidity Sweep'
      case 'silver_bullet': return 'Silver Bullet'
      case 'mmm_buy': return 'MMM Buy Model'
      case 'mmm_sell': return 'MMM Sell Model'
      case 'order_block': return 'Order Block'
      default: return type
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-emerald-400'
    if (confidence >= 60) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-2 px-4 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Signal className="w-4 h-4 text-emerald-400" /> ICT Signal Feed
            <Badge variant="secondary" className="text-xs bg-slate-800">{signals.length}</Badge>
          </CardTitle>
          <Badge className="text-xs bg-emerald-600/30 text-emerald-400 border-emerald-600/30">
            <Activity className="w-3 h-3 mr-1 animate-pulse" /> Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        {signals.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Signal className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Waiting for ICT signals...</p>
            <p className="text-xs mt-1">Connect and start strategy to detect setups</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="space-y-2 px-1">
              <AnimatePresence>
                {signals.map((signal, i) => (
                  <motion.div
                    key={signal.id || i}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getSignalIcon(signal.type)}
                        <span className="text-sm font-medium text-white">
                          {getSignalLabel(signal.type)}
                        </span>
                      </div>
                      <span className={`text-xs font-mono ${getConfidenceColor(signal.confidence)}`}>
                        {signal.confidence.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="font-medium text-slate-300">{signal.symbol}</span>
                      <Badge
                        className={`text-[10px] ${
                          signal.direction === 'bullish'
                            ? 'bg-emerald-600/30 text-emerald-400 border-emerald-600/30'
                            : 'bg-red-600/30 text-red-400 border-red-600/30'
                        }`}
                      >
                        {signal.direction?.toUpperCase()}
                      </Badge>
                      {signal.price && (
                        <span className="font-mono">{signal.price.toFixed(5)}</span>
                      )}
                      <span className="ml-auto text-slate-500">
                        {new Date(signal.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {signal.details && (
                      <p className="text-xs text-slate-500 mt-1">{signal.details}</p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Strategy Configuration Panel ──────────────────────────────────────

function StrategyConfigPanel() {
  const { strategy, setStrategy } = useTradingStore()
  const [config, setConfig] = useState({
    name: 'ICT Silver Bullet',
    strategyType: 'silver_bullet',
    pairs: 'EURUSD,GBPUSD,USDJPY',
    timeframe: 'M5',
    tradingStartHour: 10,
    tradingEndHour: 17,
    maxOpenPositions: 3,
    riskPerTrade: 1.0,
    maxDailyLoss: 3.0,
    maxSpreadPips: 2.0,
    slType: 'fvg_boundary',
    slBufferPips: 2.0,
    tpType: 'opposite_liquidity',
    fixedRR: 2.0,
    fvgMinGapPips: 3.0,
    mssMinDisplacement: 5.0,
    liquidityWickMin: 0.7,
    sbWindow1: true,
    sbWindow2: true,
    sbWindow3: true,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/strategy/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (data.success) {
        setStrategy({
          id: data.strategy.id,
          ...config,
          isActive: true,
        })
      }
    } catch (err) {
      console.error('Failed to save strategy config')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3 px-4 pt-3">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" /> ICT Strategy Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Accordion type="multiple" defaultValue={['strategy', 'risk', 'ict']} className="space-y-2">
            {/* Strategy Type */}
            <AccordionItem value="strategy" className="border-slate-700">
              <AccordionTrigger className="text-sm text-slate-300 hover:text-white">
                Strategy & Pairs
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Strategy Type</Label>
                  <Select
                    value={config.strategyType}
                    onValueChange={(v) => setConfig({ ...config, strategyType: v })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="silver_bullet">Silver Bullet</SelectItem>
                      <SelectItem value="market_maker_buy">MMM Buy Model</SelectItem>
                      <SelectItem value="market_maker_sell">MMM Sell Model</SelectItem>
                      <SelectItem value="hybrid">Hybrid (All Models)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Currency Pairs (comma-separated)</Label>
                  <Input
                    value={config.pairs}
                    onChange={(e) => setConfig({ ...config, pairs: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white text-sm"
                    placeholder="EURUSD,GBPUSD,USDJPY"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Timeframe</Label>
                    <Select
                      value={config.timeframe}
                      onValueChange={(v) => setConfig({ ...config, timeframe: v })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="M1">M1</SelectItem>
                        <SelectItem value="M5">M5</SelectItem>
                        <SelectItem value="M15">M15</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Max Positions</Label>
                    <Input
                      type="number"
                      value={config.maxOpenPositions}
                      onChange={(e) => setConfig({ ...config, maxOpenPositions: parseInt(e.target.value) || 1 })}
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                      min={1}
                      max={10}
                    />
                  </div>
                </div>

                {/* Silver Bullet Windows */}
                {config.strategyType !== 'market_maker_sell' && config.strategyType !== 'market_maker_buy' && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs text-slate-400">Silver Bullet Windows (EST)</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-md bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-300">AM Session (10:00-11:00)</span>
                        </div>
                        <Switch
                          checked={config.sbWindow1}
                          onCheckedChange={(v) => setConfig({ ...config, sbWindow1: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-300">PM Session (14:00-15:00)</span>
                        </div>
                        <Switch
                          checked={config.sbWindow2}
                          onCheckedChange={(v) => setConfig({ ...config, sbWindow2: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-300">Close Session (16:00-17:00)</span>
                        </div>
                        <Switch
                          checked={config.sbWindow3}
                          onCheckedChange={(v) => setConfig({ ...config, sbWindow3: v })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Risk Management */}
            <AccordionItem value="risk" className="border-slate-700">
              <AccordionTrigger className="text-sm text-slate-300 hover:text-white">
                Risk Management
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-400">Risk Per Trade</Label>
                    <span className="text-xs text-emerald-400">{config.riskPerTrade}%</span>
                  </div>
                  <Slider
                    value={[config.riskPerTrade]}
                    onValueChange={([v]) => setConfig({ ...config, riskPerTrade: v })}
                    min={0.5}
                    max={5}
                    step={0.5}
                    className="[&_[role=slider]]:bg-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-400">Max Daily Loss</Label>
                    <span className="text-xs text-red-400">{config.maxDailyLoss}%</span>
                  </div>
                  <Slider
                    value={[config.maxDailyLoss]}
                    onValueChange={([v]) => setConfig({ ...config, maxDailyLoss: v })}
                    min={1}
                    max={10}
                    step={0.5}
                    className="[&_[role=slider]]:bg-red-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-400">Max Spread (pips)</Label>
                    <span className="text-xs text-slate-300">{config.maxSpreadPips}</span>
                  </div>
                  <Slider
                    value={[config.maxSpreadPips]}
                    onValueChange={([v]) => setConfig({ ...config, maxSpreadPips: v })}
                    min={0.5}
                    max={5}
                    step={0.5}
                    className="[&_[role=slider]]:bg-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Stop Loss Type</Label>
                    <Select
                      value={config.slType}
                      onValueChange={(v) => setConfig({ ...config, slType: v })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="fvg_boundary">FVG Boundary</SelectItem>
                        <SelectItem value="liquidity_sweep">Liquidity Sweep</SelectItem>
                        <SelectItem value="atr">ATR-Based</SelectItem>
                        <SelectItem value="fixed">Fixed Pips</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Take Profit Type</Label>
                    <Select
                      value={config.tpType}
                      onValueChange={(v) => setConfig({ ...config, tpType: v })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="opposite_liquidity">Opposite Liquidity</SelectItem>
                        <SelectItem value="fixed_rr">Fixed R:R</SelectItem>
                        <SelectItem value="fvg_fill">FVG Fill</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-400">Fixed R:R Ratio</Label>
                    <span className="text-xs text-emerald-400">{config.fixedRR}:1</span>
                  </div>
                  <Slider
                    value={[config.fixedRR]}
                    onValueChange={([v]) => setConfig({ ...config, fixedRR: v })}
                    min={1}
                    max={5}
                    step={0.5}
                    className="[&_[role=slider]]:bg-emerald-500"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ICT Detection Settings */}
            <AccordionItem value="ict" className="border-slate-700">
              <AccordionTrigger className="text-sm text-slate-300 hover:text-white">
                ICT Detection Sensitivity
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-400">Min FVG Gap (pips)</Label>
                    <span className="text-xs text-amber-400">{config.fvgMinGapPips}</span>
                  </div>
                  <Slider
                    value={[config.fvgMinGapPips]}
                    onValueChange={([v]) => setConfig({ ...config, fvgMinGapPips: v })}
                    min={1}
                    max={10}
                    step={0.5}
                    className="[&_[role=slider]]:bg-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-400">Min MSS Displacement (pips)</Label>
                    <span className="text-xs text-purple-400">{config.mssMinDisplacement}</span>
                  </div>
                  <Slider
                    value={[config.mssMinDisplacement]}
                    onValueChange={([v]) => setConfig({ ...config, mssMinDisplacement: v })}
                    min={2}
                    max={20}
                    step={1}
                    className="[&_[role=slider]]:bg-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-400">Liquidity Wick Min Ratio</Label>
                    <span className="text-xs text-rose-400">{config.liquidityWickMin}</span>
                  </div>
                  <Slider
                    value={[config.liquidityWickMin]}
                    onValueChange={([v]) => setConfig({ ...config, liquidityWickMin: v })}
                    min={0.3}
                    max={1.0}
                    step={0.05}
                    className="[&_[role=slider]]:bg-rose-500"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── MT5 Setup Guide ───────────────────────────────────────────────────

function MT5SetupGuide() {
  const [accountNumber, setAccountNumber] = useState('')
  const [password, setPassword] = useState('')
  const [server, setServer] = useState('')
  const [connecting, setConnecting] = useState(false)
  const { setMT5 } = useTradingStore()

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/mt5/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ accountNumber, password, server }),
      })
      const data = await res.json()
      if (data.success) {
        setMT5({
          connected: true,
          accountNumber,
          server,
          balance: data.accountInfo?.balance || 0,
          equity: data.accountInfo?.equity || 0,
          leverage: data.accountInfo?.leverage || 100,
          currency: data.accountInfo?.currency || 'USD',
        })
      }
    } catch (err) {
      console.error('MT5 connection failed')
    } finally {
      setConnecting(false)
    }
  }

  const osSteps = [
    {
      os: 'Windows',
      icon: '🪟',
      steps: [
        'Install MetaTrader 5 from your broker or metaquotes.net',
        'Open MT5 and go to File → Open Data Folder',
        'Navigate to MQL5/Experts and copy the ICT_Bridge.ex5 EA',
        'Restart MT5 and attach the EA to any chart',
        'Enable "Allow DLL imports" in Tools → Options → Expert Advisors',
        'Enter your MT5 account details below and click Connect',
      ],
    },
    {
      os: 'macOS',
      icon: '🍎',
      steps: [
        'Install MT5 via PlayOnMac/Wine or use broker web terminal',
        'Configure Wine to allow network access',
        'Copy the Python bridge script to your project directory',
        'Install Python 3.10+ and MetaTrader5 package: pip install MetaTrader5',
        'Run the bridge: python mt5_bridge.py --port 5555',
        'Enter your MT5 account details below and click Connect',
      ],
    },
    {
      os: 'Linux',
      icon: '🐧',
      steps: [
        'Install Wine and Winetricks: sudo apt install wine64',
        'Download MT5 Windows installer and run via Wine',
        'Configure Wine prefix for MT5: winecfg',
        'Install Python bridge: pip3 install MetaTrader5',
        'Run bridge as systemd service or screen session',
        'Enter your MT5 account details below and click Connect',
      ],
    },
  ]

  return (
    <div className="space-y-4">
      {/* Connection Form */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3 px-4 pt-3">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" /> MT5 Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Account Number</Label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="12345678"
              className="bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Server</Label>
            <Input
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="Broker-Server"
              className="bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
          <Button
            onClick={handleConnect}
            disabled={connecting || !accountNumber || !password || !server}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
          >
            {connecting ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Connecting...</>
            ) : (
              <><Wifi className="w-4 h-4 mr-2" />Connect to MT5</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Setup Guide by OS */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3 px-4 pt-3">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" /> Setup Guide by OS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Accordion type="single" collapsible className="space-y-2">
            {osSteps.map((osGuide) => (
              <AccordionItem key={osGuide.os} value={osGuide.os} className="border-slate-700">
                <AccordionTrigger className="text-sm text-slate-300 hover:text-white">
                  <span className="flex items-center gap-2">
                    <span>{osGuide.icon}</span>
                    {osGuide.os}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="space-y-2 mt-2">
                    {osGuide.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs text-slate-400">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-[10px] font-medium">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Architecture Diagram */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3 px-4 pt-3">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Architecture
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            {[
              { label: 'ICT Sniper Dashboard', sub: 'Next.js Web App (this page)', color: 'emerald' },
              { label: 'WebSocket Service', sub: 'Real-time price feed & signals (port 3003)', color: 'teal' },
              { label: 'MT5 Bridge API', sub: 'Trade execution & account data (port 3004)', color: 'amber' },
              { label: 'Python Bridge Script', sub: 'MetaTrader5 Python SDK → MT5 Terminal', color: 'purple' },
              { label: 'MetaTrader 5 Terminal', sub: 'Your broker platform (local machine)', color: 'rose' },
            ].map((layer, i) => (
              <div key={i} className="relative">
                <div className={`p-3 rounded-lg border border-${layer.color}-500/30 bg-${layer.color}-500/5`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${layer.color}-500`} />
                    <span className="text-sm text-white font-medium">{layer.label}</span>
                  </div>
                  <p className="text-xs text-slate-400 ml-4">{layer.sub}</p>
                </div>
                {i < 4 && (
                  <div className="flex justify-center py-1">
                    <ChevronRight className="w-4 h-4 text-slate-600 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Device Management Panel ───────────────────────────────────────────

function DeviceManagement() {
  const { user } = useTradingStore()
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadDevices = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/devices', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await res.json()
      setDevices(data.devices || [])
    } catch (err) {
      console.error('Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDevices()
  }, [])

  const handleDeactivate = async (deviceId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/auth/devices', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId }),
      })
      loadDevices()
    } catch (err) {
      console.error('Failed to deactivate device')
    }
  }

  const activeDevices = devices.filter(d => d.isActive).length

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3 px-4 pt-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <MonitorSmartphone className="w-4 h-4 text-emerald-400" /> Device Management
          </CardTitle>
          <Badge className="text-xs bg-emerald-600/30 text-emerald-400 border-emerald-600/30">
            {activeDevices}/2 slots used
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Device Slots</span>
            <span className="text-xs text-emerald-400">{activeDevices} of 2</span>
          </div>
          <Progress value={(activeDevices / 2) * 100} className="h-2" />
        </div>

        {devices.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <MonitorSmartphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No registered devices</p>
          </div>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    device.isActive ? 'bg-emerald-500/20' : 'bg-slate-700'
                  }`}>
                    <MonitorSmartphone className={`w-4 h-4 ${device.isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-white">{device.name || 'Unknown Device'}</p>
                    <div className="flex gap-2 text-xs text-slate-400">
                      {device.os && <span>{device.os}</span>}
                      <span>•</span>
                      <span>{new Date(device.lastActive).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {device.isActive ? (
                    <Badge className="text-[10px] bg-emerald-600/30 text-emerald-400 border-emerald-600/30">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="text-[10px] bg-slate-700 text-slate-400">
                      Inactive
                    </Badge>
                  )}
                  {device.isActive && devices.filter(d => d.isActive).length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 text-xs"
                      onClick={() => handleDeactivate(device.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-400">License Restriction</p>
              <p className="text-xs text-slate-400 mt-1">
                Each license allows a maximum of 2 simultaneous devices. Remove a device to free up a slot.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── P&L Chart ─────────────────────────────────────────────────────────

function PnLChart() {
  const { dailyPnl, totalTrades, winningTrades, winRate, totalPnl } = useTradingStore()

  // Generate simulated equity curve data
  const equityData = Array.from({ length: 24 }, (_, i) => {
    const base = 10000
    const trend = totalPnl * (i / 24)
    const noise = (Math.random() - 0.5) * 20
    return {
      hour: `${i}:00`,
      equity: base + trend + noise,
    }
  })

  const maxEquity = Math.max(...equityData.map(d => d.equity))
  const minEquity = Math.min(...equityData.map(d => d.equity))
  const range = maxEquity - minEquity || 1

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-2 px-4 pt-3">
        <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" /> Equity Curve (24h)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-40 flex items-end gap-[2px]">
          {equityData.map((d, i) => {
            const height = ((d.equity - minEquity) / range) * 100
            const isProfit = d.equity >= 10000
            return (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(height, 5)}%` }}
                transition={{ delay: i * 0.02 }}
                className={`flex-1 rounded-t-sm min-w-[3px] ${
                  isProfit ? 'bg-emerald-500/60' : 'bg-red-500/60'
                }`}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>00:00</span>
          <span>12:00</span>
          <span>24:00</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{totalTrades}</p>
            <p className="text-xs text-slate-400">Total Trades</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-400">{winningTrades}</p>
            <p className="text-xs text-slate-400">Winners</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${winRate >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {winRate.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-400">Win Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── ICT Concepts Legend ───────────────────────────────────────────────

function ICTConceptsLegend() {
  const concepts = [
    {
      name: 'Fair Value Gap (FVG)',
      description: 'A 3-candle imbalance where the high of candle 1 doesn\'t overlap with the low of candle 3 (bullish), or vice versa (bearish). Represents institutional displacement.',
      color: 'amber',
      icon: Eye,
    },
    {
      name: 'Market Structure Shift (MSS)',
      description: 'When price breaks a significant swing point, indicating a change in trend direction. Confirmed by displacement (strong momentum candle).',
      color: 'purple',
      icon: Activity,
    },
    {
      name: 'Liquidity Sweep',
      description: 'Price wicks beyond a swing high/low to trigger stop losses, then reverses. This is how institutions accumulate positions at discount/premium prices.',
      color: 'rose',
      icon: AlertTriangle,
    },
    {
      name: 'Silver Bullet',
      description: 'ICT strategy requiring an FVG + MSS alignment during specific 1-hour windows (10AM, 2PM, 4PM EST). Entry on FVG retracement after MSS confirmation.',
      color: 'emerald',
      icon: Zap,
    },
    {
      name: 'Market Maker Model',
      description: 'Buy Model: Sell-side liquidity sweep → Bullish MSS → Bullish FVG → Entry. Sell Model is the inverse. Models the institutional order flow sequence.',
      color: 'teal',
      icon: TrendingUp,
    },
    {
      name: 'Order Block',
      description: 'The last opposing candle before a displacement move. Represents where institutions placed their orders. Acts as support/resistance on retracement.',
      color: 'blue',
      icon: Layers,
    },
  ]

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3 px-4 pt-3">
        <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" /> ICT Concepts Reference
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {concepts.map((concept) => (
            <div
              key={concept.name}
              className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
            >
              <div className="flex items-center gap-2 mb-1">
                <concept.icon className={`w-4 h-4 text-${concept.color}-400`} />
                <span className="text-sm font-medium text-white">{concept.name}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{concept.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────────

function MainDashboard() {
  const { activeTab, setActiveTab } = useTradingStore()
  const { connect } = useTradingSocket()

  useEffect(() => {
    connect()
  }, [connect])

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <DashboardHeader />

      <main className="flex-1 p-3 md:p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-900/50 border border-slate-800 p-1 h-auto flex-wrap">
            <TabsTrigger value="dashboard" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Activity className="w-3.5 h-3.5 mr-1.5" />Dashboard
            </TabsTrigger>
            <TabsTrigger value="strategy" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Settings className="w-3.5 h-3.5 mr-1.5" />Strategy
            </TabsTrigger>
            <TabsTrigger value="signals" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Signal className="w-3.5 h-3.5 mr-1.5" />Signals
            </TabsTrigger>
            <TabsTrigger value="mt5" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Cpu className="w-3.5 h-3.5 mr-1.5" />MT5 Setup
            </TabsTrigger>
            <TabsTrigger value="account" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Shield className="w-3.5 h-3.5 mr-1.5" />Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <AccountOverview />
            <PriceTicker />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PositionsPanel />
              <PnLChart />
            </div>
          </TabsContent>

          <TabsContent value="strategy" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <StrategyConfigPanel />
              <ICTConceptsLegend />
            </div>
          </TabsContent>

          <TabsContent value="signals" className="space-y-4">
            <SignalFeed />
          </TabsContent>

          <TabsContent value="mt5" className="space-y-4">
            <MT5SetupGuide />
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DeviceManagement />
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3 px-4 pt-3">
                  <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" /> License Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">License Key</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-sm font-mono text-emerald-400">
                      {useTradingStore.getState().user?.id?.slice(0, 8).toUpperCase() || 'DEMO'}-****
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Status</span>
                      <span className="text-emerald-400">Active</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Type</span>
                      <span className="text-slate-300">Professional</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Max Devices</span>
                      <span className="text-slate-300">2</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Strategy Access</span>
                      <span className="text-emerald-400">Full (SB + MMM)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950/80 backdrop-blur-xl px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>ICT Sniper v1.0 • Inner Circle Trader Strategy Bot</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>⚠️ Trading involves risk</span>
            <Separator orientation="vertical" className="h-3" />
            <span>Not financial advice</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Page Export ────────────────────────────────────────────────────────

export default function TradingDashboard() {
  const { user, setUser } = useTradingStore()

  // Auto-login check on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && !user) {
      // Quick demo auto-login for showcase
      setUser({
        id: 'demo_user',
        email: 'trader@ictsniper.com',
        name: 'Demo Trader',
        isAuthenticated: true,
        activeDevices: 1,
        maxDevices: 2,
      })
    }
  }, [user, setUser])

  if (!user?.isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <TooltipProvider>
      <MainDashboard />
    </TooltipProvider>
  )
}
