/**
 * Authentication and device licensing utilities
 * Implements max 2 devices per user account restriction
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

const MAX_DEVICES_PER_USER = 2

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

// ─── Session Token ──────────────────────────────────────────────────

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export interface SessionData {
  userId: string
  email: string
  deviceFp: string
  expiresAt: number
}

// Simple in-memory session store (production would use Redis/DB)
const sessions = new Map<string, SessionData>()

export function createSession(userId: string, email: string, deviceFp: string): string {
  const token = generateSessionToken()
  sessions.set(token, {
    userId,
    email,
    deviceFp,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  })
  return token
}

export function validateSession(token: string): SessionData | null {
  const session = sessions.get(token)
  if (!session) return null
  if (Date.now() > session.expiresAt) {
    sessions.delete(token)
    return null
  }
  return session
}

export function destroySession(token: string): void {
  sessions.delete(token)
}
