import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        licenseKey: true,
        createdAt: true,
        _count: { select: { devices: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        licenseKey: u.licenseKey,
        deviceCount: u._count.devices,
        createdAt: u.createdAt,
      })),
    })
  } catch (error: any) {
    console.error('Admin users error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await db.user.findUnique({ where: { id: userId } })
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { targetUserId, isActive } = body

    if (!targetUserId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'targetUserId and isActive are required' }, { status: 400 })
    }

    // Don't allow deactivating yourself
    if (targetUserId === userId) {
      return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 })
    }

    await db.user.update({
      where: { id: targetUserId },
      data: { isActive },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin toggle error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
