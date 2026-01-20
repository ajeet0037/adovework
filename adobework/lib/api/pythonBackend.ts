/**
 * Python Backend API Routes
 * Unified proxy for all tool operations
 */
import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export interface ProxyOptions {
    endpoint: string;
    file?: File;
    files?: File[];
    additionalFields?: Record<string, string | number | boolean>;
    outputMimeType?: string;
}

/**
 * Proxy single file to Python backend
 */
export async function proxyToPythonBackend(
    endpoint: string,
    file: File,
    additionalFields?: Record<string, string | number | boolean>
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const formData = new FormData();
        formData.append('file', file);

        if (additionalFields) {
            for (const [key, value] of Object.entries(additionalFields)) {
                formData.append(key, String(value));
            }
        }

        const response = await fetch(`${PYTHON_BACKEND_URL}${endpoint}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Operation failed' }));
            return { success: false, error: error.error || error.detail || 'Operation failed' };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        if (error instanceof Error && error.message.includes('fetch')) {
            return { success: false, error: 'Python backend is not available' };
        }
        return { success: false, error: 'Operation failed' };
    }
}

/**
 * Proxy multiple files to Python backend
 */
export async function proxyMultipleFilesToPythonBackend(
    endpoint: string,
    files: File[],
    additionalFields?: Record<string, string | number | boolean>
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const formData = new FormData();

        for (const file of files) {
            formData.append('files', file);
        }

        if (additionalFields) {
            for (const [key, value] of Object.entries(additionalFields)) {
                formData.append(key, String(value));
            }
        }

        const response = await fetch(`${PYTHON_BACKEND_URL}${endpoint}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Operation failed' }));
            return { success: false, error: error.error || error.detail || 'Operation failed' };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        if (error instanceof Error && error.message.includes('fetch')) {
            return { success: false, error: 'Python backend is not available' };
        }
        return { success: false, error: 'Operation failed' };
    }
}

/**
 * Download file from Python backend
 */
export async function downloadFromPythonBackend(fileUrl: string): Promise<ArrayBuffer | null> {
    try {
        const response = await fetch(`${PYTHON_BACKEND_URL}${fileUrl}`);
        if (!response.ok) return null;
        return await response.arrayBuffer();
    } catch {
        return null;
    }
}

/**
 * Check if Python backend is healthy
 */
export async function checkPythonBackendHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
        });
        return response.ok;
    } catch {
        return false;
    }
}

export { PYTHON_BACKEND_URL };
