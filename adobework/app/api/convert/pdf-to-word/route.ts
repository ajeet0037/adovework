import { NextRequest, NextResponse } from 'next/server';
import type { ConversionResponse, ApiErrorResponse } from '@/types/api';

/**
 * PDF to Word API Route
 * Proxies to Python FastAPI backend for conversion
 */

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json<ApiErrorResponse>({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json<ApiErrorResponse>({ error: 'Invalid file type. Please upload a PDF file.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Forward to Python backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/v1/pdf/to-word`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Conversion failed' })) as ApiErrorResponse;
      return NextResponse.json<ApiErrorResponse>(
        { error: error.error || 'Failed to convert PDF to Word' },
        { status: response.status }
      );
    }

    const result = await response.json() as ConversionResponse;

    // Download the file from Python backend
    const fileResponse = await fetch(`${PYTHON_BACKEND_URL}${result.file_url}`);
    if (!fileResponse.ok) {
      return NextResponse.json<ApiErrorResponse>({ error: 'Failed to download converted file' }, { status: 500 });
    }

    const fileBuffer = await fileResponse.arrayBuffer();

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'X-Output-Filename': result.filename,
      },
    });
  } catch (error) {
    console.error('PDF to Word conversion error:', error);

    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Python backend is not available. Please start the backend server.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to convert PDF to Word. Please try again.' },
      { status: 500 }
    );
  }
}
