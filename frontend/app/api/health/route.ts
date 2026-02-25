import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Loot Oracle API',
    version: '1.0.0',
    hackathon: 'OneHack 3.0',
    timestamp: new Date().toISOString(),
  })
}
