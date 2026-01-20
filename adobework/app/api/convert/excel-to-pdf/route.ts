import { NextRequest, NextResponse } from 'next/server';

/**
 * Excel to PDF API Route
 * Proxies to Python FastAPI backend for conversion
 */

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const isValidType = file.name.toLowerCase().endsWith('.xlsx') ||
      file.name.toLowerCase().endsWith('.xls');

    if (!isValidType) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Forward to Python backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/v1/pdf/from-excel`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Conversion failed' }));
      return NextResponse.json(
        { error: error.error || error.detail || 'Failed to convert Excel to PDF' },
        { status: response.status }
      );
    }

    const result = await response.json();

    const fileResponse = await fetch(`${PYTHON_BACKEND_URL}${result.file_url}`);
    if (!fileResponse.ok) {
      return NextResponse.json({ error: 'Failed to download converted file' }, { status: 500 });
    }

    const fileBuffer = await fileResponse.arrayBuffer();

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'X-Output-Filename': result.filename,
      },
    });
  } catch (error) {
    console.error('Excel to PDF conversion error:', error);

    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Python backend is not available. Please start the backend server.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to convert Excel to PDF. Please try again.' },
      { status: 500 }
    );
  }
}
