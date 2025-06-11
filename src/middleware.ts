import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  try {
    // Log request details
    console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`)
    
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware Error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: '/:path*',
} 