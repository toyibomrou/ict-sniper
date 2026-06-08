import { NextResponse } from 'next/server'

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
    directUrlPrefix: process.env.DIRECT_URL?.substring(0, 30) + '...',
  }

  // Test Prisma connection
  try {
    const { db } = await import('@/lib/db')
    await db.$queryRaw`SELECT 1 as test`
    diagnostics.dbConnection = 'SUCCESS'
    diagnostics.dbTestQuery = 'OK'
  } catch (error: any) {
    diagnostics.dbConnection = 'FAILED'
    diagnostics.dbError = error?.message || String(error)
    diagnostics.dbErrorCode = error?.code || 'unknown'
    diagnostics.dbErrorStack = error?.stack?.substring(0, 500)
  }

  const status = diagnostics.dbConnection === 'SUCCESS' ? 200 : 503
  return NextResponse.json(diagnostics, { status })
}
