/**
 * WebSocket hook for real-time trading data
 */
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useTradingStore } from '@/lib/store'

export function useTradingSocket() {
  const socketRef = useRef<Socket | null>(null)
  const {
    updatePrice,
    addSignal,
    addPosition,
    removePosition,
    updatePosition,
    setMT5,
    setWsConnected,
    user,
  } = useTradingStore()

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    })

    socket.on('connect', () => {
      console.log('WebSocket connected')
      setWsConnected(true)

      // Subscribe to major pairs
      socket.emit('subscribe', {
        pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCHF', 'NZDUSD', 'USDCAD'],
        userId: user?.id || 'demo',
      })
    })

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setWsConnected(false)
    })

    socket.on('price-update', (data) => {
      updatePrice(data)
    })

    socket.on('signal-detected', (data) => {
      addSignal(data)
    })

    socket.on('trade-opened', (data) => {
      addPosition({
        id: data.id,
        symbol: data.symbol,
        direction: data.direction,
        entryPrice: data.entry,
        currentPrice: data.entry,
        stopLoss: data.sl,
        takeProfit: data.tp,
        lotSize: data.lotSize,
        pnl: 0,
        pnlPips: 0,
        signalType: 'auto',
        confidence: 75,
        openedAt: new Date().toISOString(),
      })
    })

    socket.on('trade-closed', (data) => {
      removePosition(data.id)
    })

    socket.on('connection-status', (data) => {
      setMT5({
        connected: data.connected,
        balance: data.accountInfo?.balance || 0,
        equity: data.accountInfo?.equity || 0,
        leverage: data.accountInfo?.leverage || 0,
        currency: data.accountInfo?.currency || 'USD',
      })
    })

    socketRef.current = socket
  }, [updatePrice, addSignal, addPosition, removePosition, updatePosition, setMT5, setWsConnected, user])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setWsConnected(false)
    }
  }, [setWsConnected])

  const startStrategy = useCallback((strategyId: string, config: any) => {
    socketRef.current?.emit('strategy-control', {
      action: 'start',
      strategyId,
      config,
    })
  }, [])

  const stopStrategy = useCallback((strategyId: string) => {
    socketRef.current?.emit('strategy-control', {
      action: 'stop',
      strategyId,
      config: {},
    })
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return { connect, disconnect, startStrategy, stopStrategy }
}
