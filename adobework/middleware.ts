import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS, type RateLimitConfig } from '@/lib/middleware/rateLimit';

/**
 * Middleware for rate limiting and security
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    // Get client identifier (IP address)
    const identifier = 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';
    
    // Determine rate limit based on endpoint
    let rateLimitConfig: RateLimitConfig = RATE_LIMITS.api;
    
    if (pathname.startsWith('/api/convert/')) {
      rateLimitConfig = RATE_LIMITS.conversion;
    }
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(identifier, rateLimitConfig);
    
    // Add rate limit headers to response
    const headers = getRateLimitHeaders(rateLimitResult);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }
    
    // Continue with rate limit headers
    const response = NextResponse.next();
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  
  return NextResponse.next();
}

/**
 * Configure which routes to run middleware on
 */
export const config = {
  matcher: [
    '/api/:path*',
  ],
};
