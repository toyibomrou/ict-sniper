/**
 * Authentication and device licensing utilities
 * Implements max 3 devices per user account restriction
 * Sessions are now persisted in PostgreSQL via Neon
 */

import { db } from '@/lib/db'
import crypto from 'crypto'

// ─── Password Utilities ─────────────────────────────────────────────

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// ─── Device Fingerprinting ──────────────────────────────────────────

export interface DeviceInfo {
  fingerprint: string
  name?: string
  os?: string
  ip?: string
}

export function generateDeviceFingerprint(
  userAgent: string,
  ip: string,
  screenRes?: string
): string {
  const raw = `${userAgent}|${ip}|${screenRes || 'unknown'}`
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32)
}

// ─── Device Licensing ───────────────────────────────────────────────

const MAX_DEVICES_PER_USER = 3

export async function registerDevice(
  userId: string,
  deviceInfo: DeviceInfo
): Promise<{ success: boolean; deviceCount: number; error?: string }> {
  // Count active devices
  const activeDevices = await db.device.count({
    where: { userId, isActive: true },
  })

  // Check if device already registered
  const existing = await db.device.findUnique({
    where: { userId_deviceFp: { userId, deviceFp: deviceInfo.fingerprint } },
  })

  if (existing) {
    // Update last active
    await db.device.update({
      where: { id: existing.id },
      data: {
        lastActive: new Date(),
        lastIp: deviceInfo.ip,
        isActive: true,
      },
    })
    return { success: true, deviceCount: activeDevices }
  }

  // Check device limit
  if (activeDevices >= MAX_DEVICES_PER_USER) {
    return {
      success: false,
      deviceCount: activeDevices,
      error: `Maximum ${MAX_DEVICES_PER_USER} devices allowed. Please deactivate a device first.`,
    }
  }

  // Register new device
  await db.device.create({
    data: {
      userId,
      deviceFp: deviceInfo.fingerprint,
      deviceName: deviceInfo.name,
      os: deviceInfo.os,
      lastIp: deviceInfo.ip,
      lastActive: new Date(),
    },
  })

  return { success: true, deviceCount: activeDevices + 1 }
}

export async function deactivateDevice(
  userId: string,
  deviceId: string
): Promise<{ success: boolean }> {
  const device = await db.device.findFirst({
    where: { id: deviceId, userId },
  })

  if (!device) return { success: false }

  await db.device.update({
    where: { id: deviceId },
    data: { isActive: false },
  })

  return { success: true }
}

export async function getUserDevices(userId: string) {
  return db.device.findMany({
    where: { userId },
    orderBy: { lastActive: 'desc' },
  })
}

export async function checkDeviceLimit(userId: string): Promise<{
  canAddDevice: boolean
  activeDevices: number
  maxDevices: number
}> {
  const activeDevices = await db.device.count({
    where: { userId, isActive: true },
  })

  return {
    canAddDevice: activeDevices < MAX_DEVICES_PER_USER,
    activeDevices,
    maxDevices: MAX_DEVICES_PER_USER,
  }
}

// ─── License Key ────────────────────────────────────────────────────

export function generateLicenseKey(): string {
  const segments = []
  for (let i = 0; i < 4; i++) {
    segments.push(
      crypto.randomBytes(4).toString('hex').toUpperCase()
    )
  }
  return segments.join('-')
}

export async function validateLicenseKey(key: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { licenseKey: key },
  })
  return !!user?.isActive
}

// ─── Session Token (now persisted in DB) ────────────────────────────

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export interface SessionData {
  userId: string
  email: string
  deviceFp: string
  expiresAt: number
}

export async function createSession(userId: string, email: string, deviceFp: string): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Clean up expired sessions for this user first
  await db.session.deleteMany({
    where: {
      userId,
      expiresAt: { lt: new Date() },
    },
  })

  // Create new session in DB
  await db.session.create({
    data: {
      userId,
      token,
      deviceFp,
      expiresAt,
    },
  })

  return token
}

export async function validateSession(token: string): Promise<SessionData | null> {
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session) return null

  // Check expiration
  if (new Date() > session.expiresAt) {
    await db.session.delete({ where: { id: session.id } })
    return null
  }

  return {
    userId: session.userId,
    email: session.user.email,
    deviceFp: session.deviceFp || '',
    expiresAt: session.expiresAt.getTime(),
  }
}

export async function destroySession(token: string): Promise<void> {
  try {
    await db.session.delete({ where: { token } })
  } catch {
    // Session may already be deleted
  }
}

// ─── Password Reset ─────────────────────────────────────────────────

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function createPasswordReset(userId: string): Promise<string> {
  const token = generateResetToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Invalidate any existing reset tokens for this user
  await db.passwordReset.updateMany({
    where: { userId, used: false },
    data: { used: true },
  })

  // Create new reset token
  await db.passwordReset.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  return token
}

export async function validateResetToken(token: string): Promise<string | null> {
  const reset = await db.passwordReset.findUnique({
    where: { token },
  })

  if (!reset || reset.used) return null
  if (new Date() > reset.expiresAt) return null

  return reset.userId
}

export async function markResetTokenUsed(token: string): Promise<boolean> {
  try {
    await db.passwordReset.update({
      where: { token },
      data: { used: true },
    })
    return true
  } catch {
    return false
  }
}

// ─── Signal Cleanup ─────────────────────────────────────────────────

export async function cleanupOldSignals(olderThanMonths: number = 6): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - olderThanMonths)

  const result = await db.signalLog.deleteMany({
    where: {
      detectedAt: { lt: cutoffDate },
    },
  })

  return result.count
}

export async function cleanupOldTrades(olderThanMonths: number = 12): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - olderThanMonths)

  const result = await db.trade.deleteMany({
    where: {
      closedAt: { lt: cutoffDate },
      status: 'closed',
    },
  })

  return result.count
}

export async function cleanupExpiredSessions(): Promise<number> {
  const result = await db.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  return result.count
}

export async function cleanupExpiredResetTokens(): Promise<number> {
  const result = await db.passwordReset.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  return result.count
}
