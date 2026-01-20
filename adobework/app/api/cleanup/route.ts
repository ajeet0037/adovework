/**
 * Cleanup API Route
 * Triggers cleanup of temporary files on schedule or manually
 * Requirements: 9.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupOldFiles, cleanupOperation, getTrackedFileCount } from '@/lib/utils/cleanup';

// Secret key for authenticating cleanup requests (must be set in environment)
const CLEANUP_SECRET = process.env.CLEANUP_SECRET;

if (!CLEANUP_SECRET) {
  console.error('CLEANUP_SECRET environment variable is not set');
}

// Default cleanup threshold: 1 hour in milliseconds
const DEFAULT_THRESHOLD_MS = 60 * 60 * 1000;

/**
 * POST /api/cleanup
 * Trigger cleanup of old files
 * 
 * Body options:
 * - operationId: Clean up files for a specific operation
 * - thresholdMs: Custom age threshold (default: 1 hour)
 * 
 * Headers:
 * - x-cleanup-secret: Authentication secret
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    if (!CLEANUP_SECRET) {
      return NextResponse.json(
        { error: 'Service misconfigured' },
        { status: 500 }
      );
    }
    
    const secret = request.headers.get('x-cleanup-secret');
    if (secret !== CLEANUP_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { operationId, thresholdMs } = body as {
      operationId?: string;
      thresholdMs?: number;
    };

    let result;

    if (operationId) {
      // Clean up files for a specific operation
      result = cleanupOperation(operationId);
    } else {
      // Clean up all old files
      const threshold = thresholdMs || DEFAULT_THRESHOLD_MS;
      result = cleanupOldFiles(threshold);
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cleanup
 * Get cleanup status and tracked file count
 * 
 * Headers:
 * - x-cleanup-secret: Authentication secret
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    if (!CLEANUP_SECRET) {
      return NextResponse.json(
        { error: 'Service misconfigured' },
        { status: 500 }
      );
    }
    
    const secret = request.headers.get('x-cleanup-secret');
    if (secret !== CLEANUP_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const trackedCount = getTrackedFileCount();

    return NextResponse.json({
      success: true,
      trackedFileCount: trackedCount,
      thresholdMs: DEFAULT_THRESHOLD_MS,
      thresholdHours: DEFAULT_THRESHOLD_MS / (60 * 60 * 1000),
    });
  } catch (error) {
    console.error('Cleanup status error:', error);
    return NextResponse.json(
      { error: 'Failed to get cleanup status' },
      { status: 500 }
    );
  }
}
