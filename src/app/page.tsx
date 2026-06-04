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
  LogOut, User, Key, Cpu, Globe, Layers, Eye,
  Smartphone, Laptop, HelpCircle, Download, Info, ExternalLink,
  Terminal, ShieldAlert, Flame, FileCheck, AlertCircle, Wrench
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

  const handleDemoAccess = () => {
    const demoUser = {
      id: 'demo_user',
      email: 'trader@ict-sniper.vercel.app',
      name: 'Demo Trader',
      isAuthenticated: true,
      activeDevices: 1,
      maxDevices: 2,
    }
    localStorage.setItem('ict_user', JSON.stringify(demoUser))
    setUser(demoUser)
    // Set MT5 as connected with demo data immediately
    useTradingStore.getState().setMT5({
      connected: true,
      accountNumber: 'demo-10000',
      server: 'ICT-Demo',
      balance: 10000,
      equity: 10050.25,
      leverage: 100,
      currency: 'USD',
    })
    // Navigate to dashboard tab
    useTradingStore.getState().setActiveTab('dashboard')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const body: any = { email, password }
      if (isRegister) body.name = name || email.split('@')[0]

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        // If login fails, suggest registering
        if (!isRegister && data.error?.includes('Invalid')) {
          setError('Account not found. Please register first or use Demo Access.')
        } else {
          setError(data.error || 'Authentication failed')
        }
        return
      }

      localStorage.setItem('token', data.token)
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        isAuthenticated: true,
        activeDevices: data.deviceCount || 1,
        maxDevices: 2,
      }
      localStorage.setItem('ict_user', JSON.stringify(userData))
      setUser(userData)
    } catch (err) {
      setError('Network error. Please try again or use Demo Access.')
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
          <a href="https://ict-sniper.vercel.app" target="_blank" rel="noopener noreferrer" className="text-3xl font-bold text-white hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
            ICT Sniper <ExternalLink className="w-4 h-4 text-slate-500" />
          </a>
          <p className="text-slate-400 mt-2">
            Inner Circle Trader Strategy Bot • <a href="https://ict-sniper.vercel.app" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">ict-sniper.vercel.app</a>
          </p>
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
                  className="flex items-start gap-2 text-red-400 text-sm"
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
              >
                {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleDemoAccess}
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Zap className="w-4 h-4 mr-2 text-emerald-400" />
                Quick Demo Access
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
          <a href="https://ict-sniper.vercel.app" target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-white hidden sm:flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
            ICT Sniper <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
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
                localStorage.removeItem('ict_user')
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
  const { prices, updatePrice, wsConnected } = useTradingStore()
  const priceList = Array.from(prices.values())

  // Generate simulated demo prices if WS is disconnected and no prices yet
  useEffect(() => {
    if (!wsConnected && priceList.length === 0) {
      const demoPrices = [
        { symbol: 'EURUSD', bid: 1.08745, ask: 1.08767, spread: 0.00022, timestamp: Date.now() },
        { symbol: 'GBPUSD', bid: 1.27123, ask: 1.27148, spread: 0.00025, timestamp: Date.now() },
        { symbol: 'USDJPY', bid: 157.845, ask: 157.867, spread: 0.022, timestamp: Date.now() },
        { symbol: 'AUDUSD', bid: 0.66543, ask: 0.66567, spread: 0.00024, timestamp: Date.now() },
        { symbol: 'USDCHF', bid: 0.89123, ask: 0.89147, spread: 0.00024, timestamp: Date.now() },
        { symbol: 'NZDUSD', bid: 0.61234, ask: 0.61258, spread: 0.00024, timestamp: Date.now() },
        { symbol: 'USDCAD', bid: 1.36789, ask: 1.36812, spread: 0.00023, timestamp: Date.now() },
      ]
      demoPrices.forEach(p => updatePrice(p))
    }
  }, [wsConnected, priceList.length, updatePrice])

  // Animate demo prices with small tick changes
  useEffect(() => {
    if (!wsConnected && priceList.length > 0) {
      const interval = setInterval(() => {
        priceList.forEach(p => {
          const isJPY = p.symbol.includes('JPY')
          const pip = isJPY ? 0.01 : 0.0001
          const change = (Math.random() - 0.5) * pip * 3
          updatePrice({
            ...p,
            bid: p.bid + change,
            ask: p.ask + change,
            spread: p.ask + change - (p.bid + change),
            timestamp: Date.now(),
          })
        })
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [wsConnected, priceList, updatePrice])

  if (priceList.length === 0) return null

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-2 px-4 pt-3">
        <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" /> Live Prices
          {!wsConnected && (
            <Badge className="text-[10px] bg-amber-600/30 text-amber-400 border-amber-600/30 ml-1">Simulated</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-16">
          <div className="flex gap-3 px-2 overflow-x-auto">
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
  const { positions, removePosition, updatePnlStats, addPosition, wsConnected } = useTradingStore()

  // Add demo positions if empty
  useEffect(() => {
    if (positions.length === 0) {
      const demoPositions: PositionData[] = [
        {
          id: 'pos_demo_1',
          symbol: 'EURUSD',
          direction: 'buy',
          entryPrice: 1.08720,
          currentPrice: 1.08755,
          stopLoss: 1.08520,
          takeProfit: 1.09120,
          lotSize: 0.05,
          pnl: 17.50,
          pnlPips: 3.5,
          signalType: 'silver_bullet',
          confidence: 88,
          openedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'pos_demo_2',
          symbol: 'GBPUSD',
          direction: 'sell',
          entryPrice: 1.27180,
          currentPrice: 1.27110,
          stopLoss: 1.27380,
          takeProfit: 1.26780,
          lotSize: 0.03,
          pnl: 21.00,
          pnlPips: 7.0,
          signalType: 'mmm_sell',
          confidence: 82,
          openedAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ]
      demoPositions.forEach(p => addPosition(p))
    }
  }, [positions.length, addPosition])

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
  const { signals, addSignal, wsConnected } = useTradingStore()

  // Generate simulated ICT signals when WS is disconnected
  useEffect(() => {
    if (!wsConnected && signals.length === 0) {
      const demoSignals = [
        { id: 'sig_1', type: 'fvg', symbol: 'EURUSD', direction: 'bullish', price: 1.08750, confidence: 78, details: '3-candle gap: 1.08720-1.08755 (3.5 pips)', timestamp: Date.now() - 120000 },
        { id: 'sig_2', type: 'mss', symbol: 'GBPUSD', direction: 'bearish', price: 1.27100, confidence: 85, details: 'Swing low broken at 1.27150, 8.5 pip displacement', timestamp: Date.now() - 90000 },
        { id: 'sig_3', type: 'liquidity_sweep', symbol: 'USDJPY', direction: 'buy_side', price: 157.890, confidence: 72, details: 'Buy-side liquidity swept above 157.880, wick ratio 0.82', timestamp: Date.now() - 60000 },
        { id: 'sig_4', type: 'silver_bullet', symbol: 'EURUSD', direction: 'bullish', price: 1.08740, confidence: 88, details: 'AM Session: Bullish FVG + MSS alignment, entry at 1.08740', timestamp: Date.now() - 30000 },
        { id: 'sig_5', type: 'mmm_sell', symbol: 'GBPUSD', direction: 'bearish', price: 1.27120, confidence: 82, details: 'Buy-side sweep → Bearish MSS → Bearish FVG sequence complete', timestamp: Date.now() - 15000 },
      ]
      demoSignals.forEach(s => addSignal(s))
    }
  }, [wsConnected, signals.length, addSignal])

  // Continue generating random signals periodically
  useEffect(() => {
    if (!wsConnected) {
      const interval = setInterval(() => {
        const types = ['fvg', 'mss', 'liquidity_sweep', 'silver_bullet', 'mmm_buy', 'mmm_sell', 'order_block']
        const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD']
        const directions = ['bullish', 'bearish']
        const type = types[Math.floor(Math.random() * types.length)]
        const symbol = symbols[Math.floor(Math.random() * symbols.length)]
        const direction = directions[Math.floor(Math.random() * directions.length)]
        const confidence = Math.floor(Math.random() * 30) + 65

        const priceMap: Record<string, number> = { EURUSD: 1.0875, GBPUSD: 1.2712, USDJPY: 157.85, AUDUSD: 0.6655 }
        const basePrice = priceMap[symbol] || 1.0
        const isJPY = symbol.includes('JPY')
        const noise = (Math.random() - 0.5) * (isJPY ? 0.05 : 0.0003)

        addSignal({
          id: `sig_${Date.now()}`,
          type,
          symbol,
          direction,
          price: basePrice + noise,
          confidence,
          timestamp: Date.now(),
        })
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [wsConnected, addSignal])

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

// ─── Step Number Component ────────────────────────────────────────────

function StepNumber({ n, color = 'emerald' }: { n: number; color?: string }) {
  return (
    <span className={`flex-shrink-0 w-6 h-6 rounded-full bg-${color}-600/20 text-${color}-400 flex items-center justify-center text-xs font-bold`}>{n}</span>
  )
}

// ─── Security Warning Banner ─────────────────────────────────────────

function SecurityWarning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 my-3">
      <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-red-300 leading-relaxed">{children}</div>
    </div>
  )
}

// ─── Info Banner ──────────────────────────────────────────────────────

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-sky-500/10 border border-sky-500/20 my-3">
      <Info className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-slate-300 leading-relaxed">{children}</div>
    </div>
  )
}

// ─── Tip Banner ───────────────────────────────────────────────────────

function TipBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 my-3">
      <Flame className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-emerald-300 leading-relaxed">{children}</div>
    </div>
  )
}

// ─── Comprehensive Installation & Setup Guide ──────────────────────────

function InstallationGuide() {
  const [guideTab, setGuideTab] = useState('android')
  const [accountNumber, setAccountNumber] = useState('')
  const [password, setPassword] = useState('')
  const [server, setServer] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectSuccess, setConnectSuccess] = useState(false)
  const [connectError, setConnectError] = useState('')
  const { setMT5 } = useTradingStore()
  const { setActiveTab } = useTradingStore()

  const handleConnect = async () => {
    setConnecting(true)
    setConnectError('')
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
        setConnectSuccess(true)
        setTimeout(() => {
          setActiveTab('dashboard')
        }, 1500)
      } else {
        setConnectError(data.error || 'Connection failed. Please check your credentials.')
      }
    } catch (err) {
      setConnectError('Could not reach MT5 bridge. Make sure the service is running on port 3004.')
    } finally {
      setConnecting(false)
    }
  }

  const platformTabs = [
    { id: 'android', label: 'Android', icon: Smartphone },
    { id: 'ios', label: 'iOS / iPadOS', icon: Smartphone },
    { id: 'desktop', label: 'Desktop', icon: Laptop },
    { id: 'mt5bridge', label: 'MT5 Bridge', icon: Cpu },
    { id: 'troubleshoot', label: 'Troubleshoot', icon: HelpCircle },
  ]

  return (
    <div className="space-y-4">
      {/* Guide Header */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Installation & Setup Guide</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Follow the step-by-step instructions for your platform to install ICT Sniper and connect it to MetaTrader 5. Select your platform below to get started.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {platformTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={guideTab === tab.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setGuideTab(tab.id)}
            className={`whitespace-nowrap text-xs ${
              guideTab === tab.id
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5 mr-1.5" />{tab.label}
          </Button>
        ))}
      </div>

      {/* ─── ANDROID SECTION ─────────────────────────────────────────────── */}
      {guideTab === 'android' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3 px-4 pt-3">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" /> Android — APK Installation
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Install ICT Sniper on your Android device using the .apk file
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <StepNumber n={1} />
                  <div>
                    <p className="text-sm text-white font-medium">Download the APK</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Visit the official ICT Sniper download page at <a href="https://ict-sniper.vercel.app/download" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 inline-flex items-center gap-0.5">ict-sniper.vercel.app/download <ExternalLink className="w-3 h-3" /></a> on your Android device and tap the <strong className="text-slate-300">Download APK</strong> button. The file will be saved to your <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">Downloads</code> folder.
                    </p>
                    <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300 space-y-1.5">
                      <p><strong className="text-white">What is an APK file?</strong></p>
                      <p>An <strong>.apk</strong> (Android Package Kit) is the file format Android uses to distribute and install applications. It&apos;s similar to a <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">.exe</code> on Windows or a <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">.dmg</code> on macOS — it contains everything the app needs to run on your device.</p>
                      <p className="mt-1"><strong className="text-white">Why not on Google Play?</strong></p>
                      <p>Trading applications that execute real trades are often restricted on Google Play. Distributing via APK allows us to deliver the full-featured version without platform limitations, and to push updates faster.</p>
                      <p className="mt-1"><strong className="text-white">Choosing the right version:</strong></p>
                      <p>Most modern Android phones use <strong>arm64-v8a</strong>. If you have an older or budget device, you may need <strong>armeabi-v7a</strong>. Check your device specs if unsure — the wrong version simply won&apos;t install.</p>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={2} />
                  <div>
                    <p className="text-sm text-white font-medium">Enable Unknown Sources</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Android blocks app installations from outside the Play Store by default. You must explicitly allow it:
                    </p>
                    <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300 space-y-2">
                      <p><strong className="text-white">Android 8 and above (per-app):</strong></p>
                      <span className="block p-2 rounded bg-slate-900/80 text-[11px]">Settings → Apps → Special app access → Install unknown apps → Find your browser → Enable &quot;Allow from this source&quot;</span>
                      <p className="mt-1"><strong className="text-white">Android 7 and below (global):</strong></p>
                      <span className="block p-2 rounded bg-slate-900/80 text-[11px]">Settings → Security → Enable &quot;Unknown sources&quot;</span>
                    </div>
                    <InfoBanner>
                      On Android 8+, the permission is <strong>per-app</strong> — you only enable it for the browser you used to download the APK (e.g., Chrome). This is safer than the old global toggle because other apps still can&apos;t install software silently.
                    </InfoBanner>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={3} />
                  <div>
                    <p className="text-sm text-white font-medium">Install the APK</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Open the downloaded <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">ict-sniper.apk</code> file — you can find it in your notification shade (tap the &quot;Download complete&quot; notification) or in your file manager under <strong className="text-slate-300">Downloads</strong>.
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {[
                        { step: 'Tap the APK file', desc: 'Android will show an installation preview screen' },
                        { step: 'Review the permissions', desc: 'The screen lists what the app will access (Internet, Notifications, etc.)' },
                        { step: 'Tap Install', desc: 'Wait for the progress bar to complete (usually 5–15 seconds)' },
                        { step: 'Tap Open', desc: 'Launch the app immediately, or find it later in your app drawer' },
                      ].map((item) => (
                        <div key={item.step} className="flex items-start gap-2 p-2 rounded-md bg-slate-800/50">
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs text-white font-medium">{item.step}</span>
                            <span className="text-xs text-slate-500 ml-1">— {item.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      If you see a warning like &quot;This type of file can harm your device,&quot; this is Android&apos;s generic warning for all APKs. Tap <strong className="text-slate-300">Install anyway</strong> — this warning appears for every APK, including legitimate ones.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={4} />
                  <div>
                    <p className="text-sm text-white font-medium">Configure App Permissions</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      After installation, grant the following permissions when prompted. Each one serves a specific purpose:
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {[
                        { perm: 'Internet Access', reason: 'Required for real-time price feeds, WebSocket connection, and MT5 bridge communication', required: true },
                        { perm: 'Notifications', reason: 'Trade execution alerts, signal detections, and strategy status updates', required: true },
                        { perm: 'Storage', reason: 'Saving strategy configuration, log files, and cached data locally on your device', required: true },
                        { perm: 'Background Data', reason: 'Keep the strategy running and receiving prices when the app is minimized or the screen is off', required: false },
                        { perm: 'Battery Optimization Bypass', reason: 'Prevents Android from killing the app to save battery during active trading sessions', required: false },
                      ].map((item) => (
                        <div key={item.perm} className="flex items-start gap-2 p-2 rounded-md bg-slate-800/50">
                          <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${item.required ? 'text-emerald-400' : 'text-amber-400'}`} />
                          <div>
                            <span className="text-xs text-white font-medium">{item.perm}</span>
                            {!item.required && <Badge className="ml-1.5 text-[9px] bg-amber-600/20 text-amber-400 border-amber-600/20">Optional</Badge>}
                            <p className="text-xs text-slate-500 mt-0.5">{item.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={5} />
                  <div>
                    <p className="text-sm text-white font-medium">Launch &amp; Sign In</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Open ICT Sniper from your app drawer or home screen. You&apos;ll see the login screen where you can:
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {[
                        { option: 'Sign In', desc: 'Enter your registered email and password' },
                        { option: 'Register', desc: 'Create a new account with email, name, and password' },
                        { option: 'Quick Demo Access', desc: 'Explore the full dashboard instantly — no account needed' },
                      ].map((item) => (
                        <div key={item.option} className="flex items-start gap-2 p-2 rounded-md bg-slate-800/50">
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs text-white font-medium">{item.option}</span>
                            <span className="text-xs text-slate-500 ml-1">— {item.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
              </ol>

              <SecurityWarning>
                <strong>Security Notice:</strong> Only download the APK from the official ICT Sniper website at <a href="https://ict-sniper.vercel.app" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 inline-flex items-center gap-0.5">ict-sniper.vercel.app <ExternalLink className="w-3 h-3" /></a>. Never install APKs from unverified third-party sources — they may contain malware that can steal your trading credentials, intercept your MT5 password, or execute unauthorized trades on your account.
              </SecurityWarning>

              <TipBanner>
                <strong>Pro Tip:</strong> After installing, go to <strong>Settings → Battery → Unrestricted</strong> for ICT Sniper. This prevents Android from killing the app in the background, ensuring your strategy continues running without interruption. Also, pin the app in your recent apps screen to add extra protection against system cleanup.
              </TipBanner>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── iOS / iPADOS SECTION ───────────────────────────────────────── */}
      {guideTab === 'ios' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3 px-4 pt-3">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" /> iOS / iPadOS — Installation Guide
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Install ICT Sniper via TestFlight or Enterprise distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <InfoBanner>
                Apple enforces strict security policies on iOS. Apps distributed outside the App Store require either <strong>TestFlight</strong> (Apple&apos;s official beta-testing platform) or an <strong>Enterprise Certificate</strong> (for internal organizational distribution). Both methods are fully supported and safe when used as directed.
              </InfoBanner>

              {/* TestFlight Method */}
              <div className="mt-4 mb-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" /> Method A: TestFlight Installation
                </h3>
                <p className="text-xs text-slate-500 mt-1">Recommended — Apple&apos;s official way to install apps outside the App Store</p>
              </div>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <StepNumber n={1} />
                  <div>
                    <p className="text-sm text-white font-medium">Install TestFlight from the App Store</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Open the <strong className="text-slate-300">App Store</strong> on your iPhone or iPad and search for <strong className="text-slate-300">TestFlight</strong>. Tap Get to download it — it&apos;s free and made by Apple.
                    </p>
                    <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300 space-y-1.5">
                      <p><strong className="text-white">What is TestFlight?</strong></p>
                      <p>TestFlight is Apple&apos;s official platform for distributing beta and pre-release apps. It allows you to install apps that aren&apos;t on the App Store yet, with Apple&apos;s oversight. Apps distributed via TestFlight have been reviewed by Apple for basic safety.</p>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={2} />
                  <div>
                    <p className="text-sm text-white font-medium">Accept the Email Invitation</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      You will receive an email from ICT Sniper with a TestFlight invitation link. The process works like this:
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {[
                        { step: 'Check your email', desc: 'Look for an email from ICT Sniper with subject line containing "TestFlight"' },
                        { step: 'Tap "View in TestFlight"', desc: 'The email contains a button or link to open the invitation' },
                        { step: 'TestFlight opens automatically', desc: 'The app launches and shows the ICT Sniper invite card' },
                        { step: 'Tap "Accept"', desc: 'This adds ICT Sniper to your TestFlight apps list' },
                      ].map((item) => (
                        <div key={item.step} className="flex items-start gap-2 p-2 rounded-md bg-slate-800/50">
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs text-white font-medium">{item.step}</span>
                            <span className="text-xs text-slate-500 ml-1">— {item.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={3} />
                  <div>
                    <p className="text-sm text-white font-medium">Install the App</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Tap <strong className="text-slate-300">Install</strong> in TestFlight. The app will download and appear on your home screen with a small <strong className="text-orange-400">orange dot</strong> next to its name, indicating it&apos;s a TestFlight build.
                    </p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Future updates will appear as notifications in TestFlight — just tap <strong className="text-slate-300">Update</strong> to install the latest version.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={4} />
                  <div>
                    <p className="text-sm text-white font-medium">Trust the Developer Profile (if prompted)</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      On some iOS versions, you may need to manually trust the developer before the app will open:
                    </p>
                    <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 space-y-2 text-xs text-slate-300">
                      <p><strong>Step-by-step:</strong></p>
                      <span className="block p-2 rounded bg-slate-900/80 text-[11px]">1. Open <strong>Settings</strong> → <strong>General</strong> → <strong>VPN &amp; Device Management</strong></span>
                      <span className="block p-2 rounded bg-slate-900/80 text-[11px]">2. Under &quot;Developer App&quot;, tap the ICT Sniper profile</span>
                      <span className="block p-2 rounded bg-slate-900/80 text-[11px]">3. Tap <strong className="text-emerald-400">Trust &quot;ICT Sniper&quot;</strong></span>
                      <span className="block p-2 rounded bg-slate-900/80 text-[11px]">4. Confirm by tapping <strong className="text-emerald-400">Trust</strong> in the popup</span>
                    </div>
                    <InfoBanner>
                      This step only appears once. After trusting the developer, all future builds from ICT Sniper will open without this prompt.
                    </InfoBanner>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={5} />
                  <div>
                    <p className="text-sm text-white font-medium">Launch &amp; Sign In</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Open ICT Sniper from your home screen (look for the orange TestFlight dot). Sign in with your registered account, or tap <strong className="text-slate-300">Quick Demo Access</strong> to explore the dashboard instantly.
                    </p>
                  </div>
                </li>
              </ol>

              <InfoBanner>
                TestFlight builds expire after <strong>90 days</strong>. You will receive a push notification and email before expiry with a link to install the updated build. Your settings, strategies, and MT5 connection data are preserved across updates — you won&apos;t need to reconfigure anything.
              </InfoBanner>

              {/* Enterprise Method */}
              <div className="mt-6 mb-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" /> Method B: Enterprise Deployment
                </h3>
                <p className="text-xs text-slate-500 mt-1">For organizations distributing apps internally to their members</p>
              </div>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <StepNumber n={1} color="amber" />
                  <div>
                    <p className="text-sm text-white font-medium">Open the Distribution Link</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Your organization will provide a secure download link (typically via email or internal portal). Open it <strong className="text-slate-300">in Safari</strong> on your iOS device — other browsers may not correctly trigger the installation flow.
                    </p>
                    <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300 space-y-1.5">
                      <p><strong className="text-white">What is Enterprise Distribution?</strong></p>
                      <p>Apple&apos;s Developer Enterprise Program allows organizations to sign and distribute apps internally without going through the App Store. The app is signed with a trusted enterprise certificate, which your device must explicitly trust before it will run.</p>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={2} color="amber" />
                  <div>
                    <p className="text-sm text-white font-medium">Download &amp; Install the Enterprise Profile</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      When you tap the download link, iOS will prompt you to install a configuration profile. Follow these steps:
                    </p>
                    <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 space-y-2 text-xs text-slate-300">
                      <span className="block p-2 rounded bg-slate-900/80 text-[11px]">1. Tap <strong className="text-emerald-400">Allow</strong> when Safari asks to download the profile</span>
                      <span className="block p-2 rounded bg-slate-900/80 text-[11px]">2. Open <strong>Settings</strong> → you&apos;ll see a new <strong>&quot;Profile Downloaded&quot;</strong> entry near the top</span>
                      <span className="block p-2 rounded bg-slate-900/80 text-[11px]">3. Tap it → then tap <strong className="text-emerald-400">Install</strong> in the top-right corner</span>
                      <span className="block p-2 rounded bg-slate-900/80 text-[11px]">4. Enter your passcode and tap <strong className="text-emerald-400">Install</strong> again to confirm</span>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={3} color="amber" />
                  <div>
                    <p className="text-sm text-white font-medium">Trust the Enterprise Certificate</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      This is the critical step — your device will not run the app until you trust the enterprise certificate:
                    </p>
                    <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 space-y-2 text-xs text-slate-300">
                      <span className="block p-2 rounded bg-slate-900/80 text-[11px]">1. Go to <strong>Settings → General → VPN &amp; Device Management</strong></span>
                      <span className="block p-2 rounded bg-slate-900/80 text-[11px]">2. Under &quot;Enterprise App&quot;, tap the organization&apos;s profile</span>
                      <span className="block p-2 rounded bg-slate-900/80 text-[11px]">3. Tap <strong className="text-emerald-400">Trust &quot;[Organization Name]&quot;</strong></span>
                      <span className="block p-2 rounded bg-slate-900/80 text-[11px]">4. Confirm by tapping <strong className="text-emerald-400">Trust</strong></span>
                    </div>
                    <InfoBanner>
                      The trust dialog is Apple&apos;s security mechanism. It ensures you are intentionally allowing software from that organization. Only trust certificates from organizations you recognize and have a relationship with.
                    </InfoBanner>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={4} color="amber" />
                  <div>
                    <p className="text-sm text-white font-medium">Install &amp; Launch the App</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Return to Safari and tap the <strong className="text-slate-300">Install</strong> button on the distribution page. The app will download to your home screen — it will <strong>not</strong> have the orange TestFlight dot. Open it and sign in.
                    </p>
                  </div>
                </li>
              </ol>

              <SecurityWarning>
                <strong>Important:</strong> Apple may revoke Enterprise certificates if they detect misuse. If the app suddenly fails to open with a &quot;Developer Certificate Revoked&quot; message, contact your administrator for a new distribution link. Never bypass Apple&apos;s trust dialogs using third-party tools — they bypass iOS security protections and expose your device to malware.
              </SecurityWarning>

              <TipBanner>
                <strong>TestFlight vs. Enterprise:</strong> If you have access to both methods, prefer <strong>TestFlight</strong>. It is more stable, does not suffer from certificate revocation, and updates are delivered automatically. Enterprise distribution is best for large organizations that need to distribute to many users simultaneously.
              </TipBanner>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── DESKTOP SECTION (Windows / macOS / Linux) ──────────────────── */}
      {guideTab === 'desktop' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3 px-4 pt-3">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-400" /> Desktop — Windows / macOS / Linux
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Run the desktop executable and configure firewalls for MT5 connectivity
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Accordion type="multiple" defaultValue={['windows', 'firewall']} className="space-y-2">
                {/* Windows */}
                <AccordionItem value="windows" className="border-slate-700">
                  <AccordionTrigger className="text-sm text-slate-300 hover:text-white">
                    <span className="flex items-center gap-2">
                      <span className="text-base">🪟</span> Windows Installation
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <StepNumber n={1} />
                        <div>
                          <p className="text-sm text-white font-medium">Download the Installer</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Visit the official ICT Sniper download page at <a href="https://ict-sniper.vercel.app/download" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 inline-flex items-center gap-0.5">ict-sniper.vercel.app/download <ExternalLink className="w-3 h-3" /></a> and click <strong className="text-slate-300">Download for Windows</strong>. Save the <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">ICTSniper-Setup.exe</code> file to your computer.
                          </p>
                          <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300 space-y-1.5">
                            <p><strong className="text-white">Choosing the right version:</strong></p>
                            <p>Download the <strong>64-bit</strong> version unless your system is 32-bit (rare on modern PCs). To check: right-click <strong>This PC</strong> → <strong>Properties</strong> → look for &quot;System type.&quot; If it says &quot;x64-based processor,&quot; use 64-bit.</p>
                            <p className="mt-1"><strong className="text-white">What is an .exe installer?</strong></p>
                            <p>An <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">.exe</code> (executable) is the standard Windows application format. Our installer includes a setup wizard that installs ICT Sniper to your Program Files folder and creates desktop/start menu shortcuts.</p>
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <StepNumber n={2} />
                        <div>
                          <p className="text-sm text-white font-medium">Run the Installer &amp; Bypass SmartScreen</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Double-click the downloaded <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">ICTSniper-Setup.exe</code> file. Windows may show a blue SmartScreen warning:
                          </p>
                          <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 space-y-2 text-xs text-slate-300">
                            <p><strong>SmartScreen warning:</strong> &quot;Windows protected your PC&quot;</p>
                            <span className="block p-2 rounded bg-slate-900/80 text-[11px]">1. Click <strong className="text-emerald-400">More info</strong></span>
                            <span className="block p-2 rounded bg-slate-900/80 text-[11px]">2. Verify the publisher shows &quot;ICT Sniper&quot; → Click <strong className="text-emerald-400">Run anyway</strong></span>
                          </div>
                          <InfoBanner>
                            SmartScreen warns about all apps that haven&apos;t built up a reputation with Microsoft yet. This is normal for new or niche applications — it doesn&apos;t mean the app is dangerous. As more users install ICT Sniper, this warning will disappear automatically.
                          </InfoBanner>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <StepNumber n={3} />
                        <div>
                          <p className="text-sm text-white font-medium">Install MetaTrader 5</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            If you haven&apos;t already, download and install MT5 from your broker&apos;s website or from{' '}
                            <span className="text-emerald-400 underline">metaquotes.net</span>. Open it and log in with your broker credentials.
                          </p>
                          <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300 space-y-1.5">
                            <p><strong className="text-white">Broker-specific vs. MetaQuotes:</strong></p>
                            <p>Always prefer your <strong>broker&apos;s version</strong> of MT5 — it comes pre-configured with the correct server addresses. The generic MetaQuotes version works too, but you&apos;ll need to manually add your broker&apos;s server.</p>
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <StepNumber n={4} />
                        <div>
                          <p className="text-sm text-white font-medium">Deploy the Bridge EA (Expert Advisor)</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            The ICT Bridge EA is a small plugin that allows ICT Sniper to communicate with MT5:
                          </p>
                          <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 space-y-2 text-xs text-slate-300">
                            <span className="block p-2 rounded bg-slate-900/80 text-[11px]">1. In MT5, click <strong>File → Open Data Folder</strong></span>
                            <span className="block p-2 rounded bg-slate-900/80 text-[11px]">2. Navigate to <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">MQL5/Experts</code></span>
                            <span className="block p-2 rounded bg-slate-900/80 text-[11px]">3. Copy the <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">ICT_Bridge.ex5</code> file into this folder</span>
                            <span className="block p-2 rounded bg-slate-900/80 text-[11px]">4. Restart MT5 — the EA will appear in the Navigator panel under &quot;Expert Advisors&quot;</span>
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <StepNumber n={5} />
                        <div>
                          <p className="text-sm text-white font-medium">Enable DLL Imports &amp; WebRequest</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            The Bridge EA needs permission to communicate with ICT Sniper:
                          </p>
                          <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 space-y-2 text-xs text-slate-300">
                            <span className="block p-2 rounded bg-slate-900/80 text-[11px]">1. In MT5: <strong>Tools → Options → Expert Advisors</strong></span>
                            <span className="block p-2 rounded bg-slate-900/80 text-[11px]">2. Check <strong className="text-emerald-400">✓ Allow DLL imports</strong></span>
                            <span className="block p-2 rounded bg-slate-900/80 text-[11px]">3. Check <strong className="text-emerald-400">✓ Allow WebRequest for listed URL</strong></span>
                            <span className="block p-2 rounded bg-slate-900/80 text-[11px]">4. Add <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">http://localhost:3004</code> to the URL allowlist</span>
                          </div>
                          <SecurityWarning>
                            <strong>Only add <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">localhost</code> URLs to the WebRequest list.</strong> Never add external or unknown URLs — malicious WebRequest targets could allow unauthorized access to your MT5 account.
                          </SecurityWarning>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <StepNumber n={6} />
                        <div>
                          <p className="text-sm text-white font-medium">Attach EA &amp; Launch ICT Sniper</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Restart MT5, then drag the <strong className="text-slate-300">ICT_Bridge</strong> EA from the Navigator panel onto any chart. A smiley face 😊 in the top-right corner of the chart means the EA is running. Then launch ICT Sniper on your desktop and connect.
                          </p>
                        </div>
                      </li>
                    </ol>
                    <TipBanner>
                      <strong>Pro Tip:</strong> To ensure the EA starts automatically with MT5, go to <strong>Tools → Options → Expert Advisors</strong> and also check &quot;Allow algo trading.&quot; This way, if your computer restarts, MT5 will auto-start the bridge EA when it reopens.
                    </TipBanner>
                  </AccordionContent>
                </AccordionItem>

                {/* macOS */}
                <AccordionItem value="macos" className="border-slate-700">
                  <AccordionTrigger className="text-sm text-slate-300 hover:text-white">
                    <span className="flex items-center gap-2">
                      <span className="text-base">🍎</span> macOS Installation
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <StepNumber n={1} />
                        <div>
                          <p className="text-sm text-white font-medium">Download the DMG File</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Visit the official ICT Sniper download page at <a href="https://ict-sniper.vercel.app/download" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 inline-flex items-center gap-0.5">ict-sniper.vercel.app/download <ExternalLink className="w-3 h-3" /></a> from your Mac&apos;s browser (Safari, Chrome, or Firefox). Click the <strong className="text-slate-300">Download for macOS</strong> button. The file is called <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">ICTSniper.dmg</code> and is typically 80–150 MB.
                          </p>
                          <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300 space-y-1.5">
                            <p><strong className="text-white">What is a DMG file?</strong></p>
                            <p>A <strong>.dmg</strong> (Disk Image) is Apple&apos;s standard format for distributing macOS applications. Think of it like a virtual USB drive — when you open it, macOS mounts it as if you inserted a disk, and the application inside can be dragged to your Applications folder.</p>
                            <p className="mt-1"><strong className="text-white">Where does it save?</strong></p>
                            <p>By default, Safari downloads the DMG to your <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">~/Downloads</code> folder. You can find it by clicking the download arrow in Safari&apos;s toolbar, or by opening Finder → Downloads.</p>
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <StepNumber n={2} />
                        <div>
                          <p className="text-sm text-white font-medium">Open the DMG &amp; Install</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Double-click the downloaded <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">ICTSniper.dmg</code> file. A new Finder window will open showing two items:
                          </p>
                          <div className="mt-2 space-y-1.5">
                            {[
                              { icon: '📁', item: 'ICT Sniper.app', desc: 'The application itself — drag this to your Applications folder' },
                              { icon: '📂', item: 'Applications folder shortcut', desc: 'A shortcut link — drag the app here to install' },
                            ].map((entry) => (
                              <div key={entry.item} className="flex items-start gap-2 p-2 rounded-md bg-slate-800/50">
                                <span className="text-sm">{entry.icon}</span>
                                <div>
                                  <span className="text-xs text-white font-medium">{entry.item}</span>
                                  <span className="text-xs text-slate-500 ml-1">— {entry.desc}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            Drag the <strong className="text-slate-300">ICT Sniper.app</strong> icon onto the <strong className="text-slate-300">Applications</strong> folder shortcut. macOS will copy the app. Once complete, you can eject the DMG by right-clicking it in Finder&apos;s sidebar and selecting <strong className="text-slate-300">Eject</strong>.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <StepNumber n={3} />
                        <div>
                          <p className="text-sm text-white font-medium">First Launch — Bypass Gatekeeper</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            On first launch, macOS Gatekeeper may block the app because it was downloaded from the internet (not the App Store). To bypass this:
                          </p>
                          <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 space-y-2 text-xs text-slate-300">
                            <p><strong>Option A (Recommended):</strong> Right-click (or Control-click) the app → select <strong className="text-emerald-400">Open</strong> from the context menu → click <strong className="text-emerald-400">Open</strong> again when prompted.</p>
                            <p><strong>Option B:</strong> Go to <strong>System Settings → Privacy &amp; Security</strong> → scroll down to the security warning about ICT Sniper → click <strong className="text-emerald-400">Open Anyway</strong>.</p>
                          </div>
                          <InfoBanner>
                            You only need to do this once. After the first successful launch, macOS remembers your choice and the app will open normally in the future.
                          </InfoBanner>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <StepNumber n={4} />
                        <div>
                          <p className="text-sm text-white font-medium">Install MT5 via CrossOver / PlayOnMac</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            MetaTrader 5 does not have a native macOS version. Use <strong className="text-slate-300">CrossOver</strong> (paid, user-friendly) or <strong className="text-slate-300">PlayOnMac</strong> (free, Wine-based) to run the Windows version. Follow your broker&apos;s macOS setup guide for detailed MT5 installation steps.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <StepNumber n={5} />
                        <div>
                          <p className="text-sm text-white font-medium">Run the Python Bridge</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Install Python 3.10+ via Homebrew: <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">brew install python</code>, then:{' '}
                            <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">pip3 install MetaTrader5</code> (runs inside the Wine environment). Start the bridge:{' '}
                            <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">python3 mt5_bridge.py --port 5555</code>
                          </p>
                        </div>
                      </li>
                    </ol>
                    <SecurityWarning>
                      <strong>Only download the DMG from the official ICT Sniper website at <a href="https://ict-sniper.vercel.app" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 inline-flex items-center gap-0.5">ict-sniper.vercel.app <ExternalLink className="w-3 h-3" /></a>.</strong> Attackers sometimes create fake DMG files that look identical but contain trojan horses. Always verify the URL starts with <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">ict-sniper.vercel.app</code>. If macOS shows a warning that the file &quot;cannot be opened because the developer cannot be verified,&quot; this is expected for apps outside the App Store — but only bypass it if you downloaded the file from the official source.
                    </SecurityWarning>
                    <InfoBanner>
                      Since MT5 on macOS runs through Wine, the Python bridge script must also execute within the same Wine prefix to communicate with MT5. Use: <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">wine python mt5_bridge.py</code>
                    </InfoBanner>
                  </AccordionContent>
                </AccordionItem>

                {/* Linux */}
                <AccordionItem value="linux" className="border-slate-700">
                  <AccordionTrigger className="text-sm text-slate-300 hover:text-white">
                    <span className="flex items-center gap-2">
                      <span className="text-base">🐧</span> Linux Installation
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <StepNumber n={1} />
                        <div>
                          <p className="text-sm text-white font-medium">Download the AppImage or .deb Package</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Visit the official ICT Sniper download page at <a href="https://ict-sniper.vercel.app/download" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 inline-flex items-center gap-0.5">ict-sniper.vercel.app/download <ExternalLink className="w-3 h-3" /></a> and choose your package format:
                          </p>
                          <div className="mt-2 space-y-1.5">
                            {[
                              { format: 'AppImage', desc: 'Universal — works on all Linux distributions. No installation required, just make it executable and run', cmd: 'chmod +x ICTSniper.AppImage && ./ICTSniper.AppImage' },
                              { format: '.deb (Debian/Ubuntu)', desc: 'Native package for Debian-based systems. Installs to /opt with desktop integration', cmd: 'sudo dpkg -i ictsniper_amd64.deb' },
                              { format: '.rpm (Fedora/openSUSE)', desc: 'Native package for RPM-based distributions', cmd: 'sudo rpm -i ictsniper_amd64.rpm' },
                            ].map((item) => (
                              <div key={item.format} className="p-2 rounded-md bg-slate-800/50">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-white font-medium">{item.format}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                <code className="block mt-1 px-2 py-1 rounded bg-slate-900/80 text-emerald-400 text-[10px]">{item.cmd}</code>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300 space-y-1.5">
                            <p><strong className="text-white">What is an AppImage?</strong></p>
                            <p>An AppImage is a self-contained Linux application that runs without installation. Think of it like a portable .exe — it includes all dependencies and runs on any Linux distro. Just download, make executable, and run.</p>
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <StepNumber n={2} />
                        <div>
                          <p className="text-sm text-white font-medium">Install Wine &amp; MT5</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            MetaTrader 5 is a Windows application. On Linux, you need Wine (a Windows compatibility layer) to run it:
                          </p>
                          <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 space-y-2 text-xs text-slate-300">
                            <p><strong>Install Wine (Ubuntu/Debian):</strong></p>
                            <code className="block px-2 py-1 rounded bg-slate-900/80 text-emerald-400 text-[10px]">sudo dpkg --add-architecture i386</code>
                            <code className="block px-2 py-1 rounded bg-slate-900/80 text-emerald-400 text-[10px]">sudo apt update &amp;&amp; sudo apt install wine64 winetricks</code>
                            <p className="mt-2"><strong>Install Wine (Fedora):</strong></p>
                            <code className="block px-2 py-1 rounded bg-slate-900/80 text-emerald-400 text-[10px]">sudo dnf install wine winetricks</code>
                            <p className="mt-2"><strong>Then install MT5:</strong></p>
                            <code className="block px-2 py-1 rounded bg-slate-900/80 text-emerald-400 text-[10px]">wine mt5setup.exe</code>
                          </div>
                          <InfoBanner>
                            Wine 7.0+ is recommended for best MT5 compatibility. If you encounter rendering issues, try setting the Windows version to Windows 10 in <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">winecfg</code>.
                          </InfoBanner>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <StepNumber n={3} />
                        <div>
                          <p className="text-sm text-white font-medium">Configure the Wine Prefix</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            A Wine prefix is an isolated Windows environment. Create a dedicated one for MT5:
                          </p>
                          <div className="mt-2 p-3 rounded-md bg-slate-800/80 border border-slate-700/50 space-y-2 text-xs text-slate-300">
                            <code className="block px-2 py-1 rounded bg-slate-900/80 text-emerald-400 text-[10px]">WINEPREFIX=~/.mt5 winecfg</code>
                            <p className="mt-1">In the configuration window:</p>
                            <span className="block p-2 rounded bg-slate-900/80 text-[11px]">1. Set <strong>Windows version</strong> to <strong className="text-emerald-400">Windows 10</strong></span>
                            <span className="block p-2 rounded bg-slate-900/80 text-[11px]">2. Under <strong>Applications</strong> tab, ensure default settings apply</span>
                            <span className="block p-2 rounded bg-slate-900/80 text-[11px]">3. Under <strong>Libraries</strong> tab, confirm network libraries are enabled</span>
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <StepNumber n={4} />
                        <div>
                          <p className="text-sm text-white font-medium">Run Python Bridge as a Persistent Service</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            The Python bridge must stay running in the background for ICT Sniper to communicate with MT5. You have three options:
                          </p>
                          <div className="mt-2 space-y-2">
                            {[
                              { method: 'Quick (screen session)', desc: 'Runs in a detachable terminal session', cmd: 'screen -S bridge\nWINEPREFIX=~/.mt5 wine python mt5_bridge.py --port 5555\n# Detach: Ctrl+A, D\n# Reattach: screen -r bridge' },
                              { method: 'Persistent (systemd)', desc: 'Auto-starts on boot, auto-restarts on crash', cmd: 'sudo nano /etc/systemd/system/mt5-bridge.service\n# Then: sudo systemctl enable --now mt5-bridge' },
                              { method: 'Simple (tmux)', desc: 'Alternative to screen, more features', cmd: 'tmux new -s bridge\nWINEPREFIX=~/.mt5 wine python mt5_bridge.py --port 5555\n# Detach: Ctrl+B, D' },
                            ].map((item) => (
                              <div key={item.method} className="p-2.5 rounded-md bg-slate-800/50 border border-slate-700/30">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-white font-medium">{item.method}</span>
                                  <span className="text-xs text-slate-500">— {item.desc}</span>
                                </div>
                                <pre className="mt-1.5 px-2 py-1.5 rounded bg-slate-900/80 text-emerald-400 text-[10px] whitespace-pre-wrap font-mono">{item.cmd}</pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      </li>
                    </ol>
                    <TipBanner>
                      <strong>Pro Tip:</strong> Use <strong>systemd</strong> to auto-start the MT5 bridge on boot. This ensures your strategy reconnects automatically after system reboots — no manual intervention needed. This is especially important if you&apos;re running on a VPS.
                    </TipBanner>
                    <SecurityWarning>
                      <strong>Keep your Wine prefix isolated.</strong> Only install MT5 and the Python bridge inside the dedicated <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">~/.mt5</code> prefix. Don&apos;t install other Windows software in the same prefix — it could interfere with MT5&apos;s operation or create security vulnerabilities.
                    </SecurityWarning>
                  </AccordionContent>
                </AccordionItem>

                {/* Firewall Configuration */}
                <AccordionItem value="firewall" className="border-slate-700">
                  <AccordionTrigger className="text-sm text-slate-300 hover:text-white">
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400" /> Firewall Configuration
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      ICT Sniper and the MT5 Bridge communicate over local network ports. Your firewall must allow these connections for real-time synchronization.
                    </p>

                    <div className="p-3 rounded-md bg-slate-800/80 border border-slate-700/50">
                      <p className="text-xs font-semibold text-white mb-2">Required Ports</p>
                      <div className="space-y-1.5">
                        {[
                          { port: '3003', proto: 'WebSocket', desc: 'Real-time price feed & signal broadcast' },
                          { port: '3004', proto: 'HTTP REST', desc: 'MT5 Bridge API — trade execution & account data' },
                          { port: '5555', proto: 'TCP', desc: 'Python Bridge → MT5 Terminal (if using Python bridge)' },
                        ].map((p) => (
                          <div key={p.port} className="flex items-center gap-2 text-xs">
                            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/20 text-[10px] font-mono">{p.port}</Badge>
                            <span className="text-slate-400">{p.proto}</span>
                            <span className="text-slate-500">— {p.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-white mb-1.5">Windows Firewall</p>
                        <div className="p-2.5 rounded-md bg-slate-800/50 border border-slate-700/50 space-y-1 text-[11px] font-mono text-slate-300">
                          <p>netsh advfirewall firewall add rule name=&quot;ICT Sniper WS&quot; dir=in action=allow protocol=tcp localport=3003</p>
                          <p>netsh advfirewall firewall add rule name=&quot;ICT Sniper MT5&quot; dir=in action=allow protocol=tcp localport=3004</p>
                          <p>netsh advfirewall firewall add rule name=&quot;ICT Sniper Bridge&quot; dir=in action=allow protocol=tcp localport=5555</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white mb-1.5">Linux (UFW)</p>
                        <div className="p-2.5 rounded-md bg-slate-800/50 border border-slate-700/50 space-y-1 text-[11px] font-mono text-slate-300">
                          <p>sudo ufw allow 3003/tcp</p>
                          <p>sudo ufw allow 3004/tcp</p>
                          <p>sudo ufw allow 5555/tcp</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white mb-1.5">macOS Firewall</p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Go to <strong className="text-slate-300">System Settings → Network → Firewall → Options</strong>. Add ICT Sniper and the Python bridge to the list of allowed apps. Alternatively, disable the built-in firewall temporarily during setup to verify connectivity.
                        </p>
                      </div>
                    </div>

                    <SecurityWarning>
                      <strong>Never expose these ports to the public internet.</strong> All communication happens on your local machine (localhost). Only open ports in your firewall for <strong>localhost (127.0.0.1)</strong> connections. If you use a VPS, restrict access with security groups or IP allowlists.
                    </SecurityWarning>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── MT5 BRIDGE SECTION ──────────────────────────────────────────── */}
      {guideTab === 'mt5bridge' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* How to Retrieve Credentials */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3 px-4 pt-3">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" /> MT5 Bridge — Retrieve Your Credentials
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Find your MT5 account details and connect ICT Sniper for real-time synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <StepNumber n={1} />
                  <div>
                    <p className="text-sm text-white font-medium">Open MetaTrader 5</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Launch the MT5 terminal on your computer. Ensure you are logged in and connected to your broker's server.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={2} />
                  <div>
                    <p className="text-sm text-white font-medium">Locate Your Account Number</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      In MT5, go to <strong className="text-slate-300">File → Login to Trade Account</strong> or check the <strong className="text-slate-300">Navigator</strong> panel on the left. Your account number (also called "Login ID") is an 8-digit number like <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">12345678</code>.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={3} />
                  <div>
                    <p className="text-sm text-white font-medium">Identify Your Server</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      In the same login dialog, you'll see the server field (e.g., <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">MetaQuotes-Demo</code> or <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">YourBroker-Live3</code>). This must match exactly.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={4} />
                  <div>
                    <p className="text-sm text-white font-medium">Enter Your Password</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Use the same password you use to log into MT5. If you forgot it, reset it through your broker's client portal — do not use the "Investor Password" (read-only), you need the <strong className="text-emerald-400">Master/Trading Password</strong>.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={5} />
                  <div>
                    <p className="text-sm text-white font-medium">Input Credentials & Connect</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Enter the Account Number, Password, and Server in the connection form below and click <strong className="text-emerald-400">Connect to MT5</strong>.
                    </p>
                  </div>
                </li>
              </ol>

              <SecurityWarning>
                <strong>Never share your MT5 password with anyone.</strong> ICT Sniper only sends credentials to your locally running MT5 Bridge (port 3004). We never transmit your password to external servers. If anyone asks for your MT5 credentials, it is a scam — report it immediately.
              </SecurityWarning>

              <TipBanner>
                <strong>Demo vs. Live:</strong> Always test with a demo account first. Most brokers offer free demo accounts with virtual funds. Once you've verified the setup works, switch to your live account credentials.
              </TipBanner>
            </CardContent>
          </Card>

          {/* Connection Form */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3 px-4 pt-3">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" /> Connect to MT5
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Account Number (Login ID)</Label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="12345678"
                  className="bg-slate-800 border-slate-700 text-white text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Master / Trading Password</Label>
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
                  placeholder="Broker-Server3"
                  className="bg-slate-800 border-slate-700 text-white text-sm"
                />
              </div>

              {connectSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-emerald-400">Connected! Redirecting to dashboard...</span>
                </motion.div>
              )}

              {connectError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-400">{connectError}</span>
                </motion.div>
              )}

              <Button
                onClick={handleConnect}
                disabled={connecting || connectSuccess || !accountNumber || !password || !server}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
              >
                {connecting ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Connecting...</>
                ) : connectSuccess ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Connected!</>
                ) : (
                  <><Wifi className="w-4 h-4 mr-2" />Connect to MT5</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Architecture Diagram */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3 px-4 pt-3">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" /> Connection Architecture
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
        </motion.div>
      )}

      {/* ─── TROUBLESHOOTING SECTION ─────────────────────────────────────── */}
      {guideTab === 'troubleshoot' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3 px-4 pt-3">
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" /> Quick Troubleshooting
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Common connectivity issues and their solutions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Accordion type="multiple" defaultValue={[]} className="space-y-2">
                {[
                  {
                    id: 'no-connection',
                    icon: <WifiOff className="w-4 h-4 text-red-400" />,
                    title: '"Could not reach MT5 bridge" error',
                    content: (
                      <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                        <p><strong className="text-white">Cause:</strong> The MT5 Bridge service is not running or is unreachable on port 3004.</p>
                        <p><strong className="text-white">Solutions:</strong></p>
                        <ol className="space-y-1.5 ml-2">
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">1.</span> Verify the MT5 Bridge is running: open a browser and visit <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">http://localhost:3004/health</code></li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">2.</span> Check your firewall isn't blocking port 3004 (see the Firewall Configuration section)</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">3.</span> If using a VPS, ensure the port is accessible and not blocked by security groups</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">4.</span> Restart the MT5 Bridge service: <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">bun run dev</code> in the mt5-bridge directory</li>
                        </ol>
                      </div>
                    ),
                  },
                  {
                    id: 'auth-failed',
                    icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
                    title: '"Invalid credentials" when connecting to MT5',
                    content: (
                      <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                        <p><strong className="text-white">Cause:</strong> Wrong account number, password, or server name.</p>
                        <p><strong className="text-white">Solutions:</strong></p>
                        <ol className="space-y-1.5 ml-2">
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">1.</span> Double-check your Account Number — it's an 8-digit number, not your email</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">2.</span> Use your <strong className="text-white">Master/Trading password</strong>, not the Investor (read-only) password</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">3.</span> The server name must match exactly as shown in MT5 (case-sensitive)</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">4.</span> If you copy-pasted the server name, ensure no trailing spaces</li>
                        </ol>
                      </div>
                    ),
                  },
                  {
                    id: 'no-prices',
                    icon: <Activity className="w-4 h-4 text-purple-400" />,
                    title: 'Prices not updating / showing stale data',
                    content: (
                      <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                        <p><strong className="text-white">Cause:</strong> WebSocket connection to the price feed is disconnected.</p>
                        <p><strong className="text-white">Solutions:</strong></p>
                        <ol className="space-y-1.5 ml-2">
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">1.</span> Click the <strong className="text-white">Connect</strong> button in the header to reconnect the WebSocket</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">2.</span> Verify the Trading WebSocket service is running on port 3003</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">3.</span> Check your internet connection — a brief disconnect can break the WebSocket</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">4.</span> Refresh the page (F5) — the app will auto-reconnect on load</li>
                        </ol>
                      </div>
                    ),
                  },
                  {
                    id: 'strategy-not-trading',
                    icon: <Square className="w-4 h-4 text-amber-400" />,
                    title: 'Strategy is running but not opening trades',
                    content: (
                      <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                        <p><strong className="text-white">Cause:</strong> Strategy may not meet entry conditions, or MT5 is not connected.</p>
                        <p><strong className="text-white">Solutions:</strong></p>
                        <ol className="space-y-1.5 ml-2">
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">1.</span> Ensure MT5 is <strong className="text-white">connected</strong> (green badge in header)</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">2.</span> Check that you're within a Silver Bullet trading window (10AM, 2PM, or 4PM EST)</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">3.</span> Verify your configured pairs have sufficient price data and tight spreads</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">4.</span> Lower the minimum confidence threshold in Strategy Settings if it's set too high</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">5.</span> Check the Signals tab — if signals are being detected but not traded, the issue is MT5 execution</li>
                        </ol>
                      </div>
                    ),
                  },
                  {
                    id: 'apk-wont-install',
                    icon: <Smartphone className="w-4 h-4 text-rose-400" />,
                    title: "APK won't install on Android",
                    content: (
                      <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                        <p><strong className="text-white">Cause:</strong> Unknown sources disabled, APK corruption, or architecture mismatch.</p>
                        <p><strong className="text-white">Solutions:</strong></p>
                        <ol className="space-y-1.5 ml-2">
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">1.</span> Enable "Install unknown apps" for your browser (Android 8+) or "Unknown sources" (Android 7-)</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">2.</span> Re-download the APK — a corrupted download will fail to install</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">3.</span> Ensure you downloaded the correct architecture (arm64-v8a for most modern phones, armeabi-v7a for older devices)</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">4.</span> Check available storage — you need at least 100 MB free</li>
                        </ol>
                      </div>
                    ),
                  },
                  {
                    id: 'ios-revoked',
                    icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
                    title: 'iOS app suddenly won\'t open ("Certificate Revoked")',
                    content: (
                      <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                        <p><strong className="text-white">Cause:</strong> Apple has revoked the Enterprise certificate used to sign the app.</p>
                        <p><strong className="text-white">Solutions:</strong></p>
                        <ol className="space-y-1.5 ml-2">
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">1.</span> Contact your administrator for a new distribution link with a valid certificate</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">2.</span> Switch to the <strong className="text-white">TestFlight</strong> distribution method — it's more stable and doesn't suffer from certificate revocation</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">3.</span> Do not attempt to bypass the revocation with third-party tools — this is a security risk</li>
                        </ol>
                      </div>
                    ),
                  },
                  {
                    id: 'firewall-block',
                    icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
                    title: 'Connection works locally but fails from another device',
                    content: (
                      <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                        <p><strong className="text-white">Cause:</strong> The firewall on the host machine is blocking inbound connections on the bridge ports.</p>
                        <p><strong className="text-white">Solutions:</strong></p>
                        <ol className="space-y-1.5 ml-2">
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">1.</span> Open ports 3003, 3004, and 5555 in your firewall (see Desktop → Firewall Configuration)</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">2.</span> Ensure the MT5 Bridge is bound to <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">0.0.0.0</code> not just <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">127.0.0.1</code></li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">3.</span> If using a VPS, configure security groups to allow inbound TCP on the required ports</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold">4.</span> Test with <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px]">telnet HOST_IP 3004</code> from the remote device</li>
                        </ol>
                      </div>
                    ),
                  },
                ].map((item) => (
                  <AccordionItem key={item.id} value={item.id} className="border-slate-700">
                    <AccordionTrigger className="text-sm text-slate-300 hover:text-white text-left">
                      <span className="flex items-center gap-2">
                        {item.icon}
                        {item.title}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">{item.content}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Still Need Help */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Still Having Issues?</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    If none of the solutions above resolve your problem, try these general steps:
                  </p>
                  <ol className="mt-2 space-y-1.5">
                    {[
                      'Restart all services (MT5 terminal, MT5 Bridge, WebSocket service)',
                      'Clear your browser cache and refresh the ICT Sniper dashboard',
                      'Check the service logs for error messages',
                      'Verify your MT5 account is active and not in read-only mode',
                      'Contact support with a screenshot of the error and your system info',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-600/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
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
            <TabsTrigger value="setup" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />Setup
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

          <TabsContent value="setup" className="space-y-4">
            <InstallationGuide />
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
            <a href="https://ict-sniper.vercel.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>ICT Sniper v1.0 • ict-sniper.vercel.app</span>
              <ExternalLink className="w-3 h-3 text-slate-600" />
            </a>
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
  const [initializing, setInitializing] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user?.isAuthenticated) {
        // Restore previously saved session
        const stored = localStorage.getItem('ict_user')
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            if (parsed?.isAuthenticated) {
              setUser(parsed)
            }
          } catch {
            // Invalid stored data, clear it
            localStorage.removeItem('ict_user')
          }
        }
      }
      setInitializing(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [user, setUser])

  // Show loading spinner while initializing auth
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-400 text-sm">Initializing ICT Sniper...</p>
        </motion.div>
      </div>
    )
  }

  if (!user?.isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <TooltipProvider>
      <MainDashboard />
    </TooltipProvider>
  )
}
