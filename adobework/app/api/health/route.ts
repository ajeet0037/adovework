import { NextResponse } from 'next/server';

/**
 * Health check endpoint for load balancers and monitoring
 * Returns 200 OK if the application is healthy
 */
export async function GET() {
  try {
    // Basic health check - can be extended with database checks, etc.
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
