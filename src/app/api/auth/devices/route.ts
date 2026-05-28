import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, getUserDevices, deactivateDevice, checkDeviceLimit } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = validateSession(token)
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const [devices, limitInfo] = await Promise.all([
      getUserDevices(session.userId),
      checkDeviceLimit(session.userId),
    ])

    return NextResponse.json({
      devices: devices.map(d => ({
        id: d.id,
        name: d.deviceName,
        os: d.os,
        lastIp: d.lastIp,
        lastActive: d.lastActive,
        isActive: d.isActive,
        registeredAt: d.registeredAt,
      })),
      ...limitInfo,
    })
  } catch (error) {
    console.error('Devices fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = validateSession(token)
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const { deviceId } = await req.json()
    const result = await deactivateDevice(session.userId, deviceId)

    if (!result.success) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    const limitInfo = await checkDeviceLimit(session.userId)
    return NextResponse.json({ success: true, ...limitInfo })
  } catch (error) {
    console.error('Device deactivation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
