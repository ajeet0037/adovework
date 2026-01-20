/**
 * Python Backend Proxy Utility
 * Forwards requests from Next.js to Python FastAPI backend
 */

// Python backend URL - defaults to localhost:8000
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export interface ProxyResponse {
    success: boolean;
    file_url?: string;
    filename?: string;
    file_size?: number;
    processing_time?: number;
    error?: string;
    // For compression
    original_size?: number;
    compression_ratio?: number;
    // For OCR
    text?: string;
    confidence?: number;
}

/**
 * Proxy a file upload to Python backend
 */
export async function proxyToBackend(
    endpoint: string,
    file: File,
    additionalFields?: Record<string, string>
): Promise<ProxyResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Add any additional form fields
    if (additionalFields) {
        for (const [key, value] of Object.entries(additionalFields)) {
            formData.append(key, value);
        }
    }

    const response = await fetch(`${PYTHON_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || error.detail || `Backend error: ${response.status}`);
    }

    return await response.json();
}

/**
 * Proxy multiple files to Python backend
 */
export async function proxyFilesToBackend(
    endpoint: string,
    files: File[],
    additionalFields?: Record<string, string>
): Promise<ProxyResponse> {
    const formData = new FormData();

    for (const file of files) {
        formData.append('files', file);
    }

    if (additionalFields) {
        for (const [key, value] of Object.entries(additionalFields)) {
            formData.append(key, value);
        }
    }

    const response = await fetch(`${PYTHON_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || error.detail || `Backend error: ${response.status}`);
    }

    return await response.json();
}

/**
 * Download file from Python backend
 */
export async function downloadFromBackend(fileUrl: string): Promise<Blob> {
    const response = await fetch(`${PYTHON_BACKEND_URL}${fileUrl}`);

    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
    }

    return await response.blob();
}

/**
 * Get download URL for Python backend
 */
export function getBackendDownloadUrl(fileUrl: string): string {
    return `${PYTHON_BACKEND_URL}${fileUrl}`;
}

/**
 * Check if Python backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
        });
        return response.ok;
    } catch {
        return false;
    }
}

export { PYTHON_BACKEND_URL };
