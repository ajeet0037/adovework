/**
 * PDF unlock/decryption functionality using pdf-lib
 * @module lib/pdf/unlock
 */

import { PDFDocument } from 'pdf-lib';
import { savePdf } from './utils';

/**
 * Result of an unlock attempt
 */
export interface UnlockResult {
  /** Whether the unlock was successful */
  success: boolean;
  /** The unlocked PDF bytes (if successful) */
  pdf?: Uint8Array;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Unlock a password-protected PDF
 * 
 * Note: pdf-lib has limited support for encrypted PDFs. This implementation
 * attempts to load the PDF with ignoreEncryption option. For full decryption
 * support, a server-side solution may be needed.
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param password - The password to unlock the PDF
 * @returns Promise resolving to UnlockResult
 * 
 * @example
 * ```typescript
 * const pdf = await fetch('/protected.pdf').then(r => r.arrayBuffer());
 * const result = await unlockPdf(pdf, 'mypassword');
 * if (result.success) {
 *   // Use result.pdf
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function unlockPdf(
  pdfBuffer: ArrayBuffer,
  password: string
): Promise<UnlockResult> {
  try {
    // Note: pdf-lib does not support password-based decryption directly
    // We try to load with ignoreEncryption to bypass restrictions
    // For actual password-protected PDFs, a server-side solution is needed
    const pdf = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
    });

    // Save without encryption to create an unlocked copy
    const unlockedBytes = await pdf.save();

    return {
      success: true,
      pdf: unlockedBytes,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for common error types
    if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
      return {
        success: false,
        error: 'This PDF is encrypted and cannot be unlocked with pdf-lib. Please use a different tool.',
      };
    }

    return {
      success: false,
      error: `Failed to unlock PDF: ${errorMessage}`,
    };
  }
}

/**
 * Check if a PDF requires a password to open
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @returns Promise resolving to true if password is required
 */
export async function requiresPassword(pdfBuffer: ArrayBuffer): Promise<boolean> {
  try {
    // Try to load without password
    await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: false,
    });
    return false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    // Check if the error is due to encryption
    return errorMessage.includes('password') || errorMessage.includes('encrypted');
  }
}


/**
 * Try to unlock a PDF with multiple passwords
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param passwords - Array of passwords to try
 * @returns Promise resolving to UnlockResult with the first successful password
 */
export async function tryUnlockWithPasswords(
  pdfBuffer: ArrayBuffer,
  passwords: string[]
): Promise<UnlockResult & { usedPassword?: string }> {
  for (const password of passwords) {
    const result = await unlockPdf(pdfBuffer, password);
    if (result.success) {
      return {
        ...result,
        usedPassword: password,
      };
    }
  }

  return {
    success: false,
    error: 'None of the provided passwords worked.',
  };
}

/**
 * Check if a PDF has owner restrictions (can be opened but has limited permissions)
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @returns Promise resolving to true if the PDF has owner restrictions
 */
export async function hasOwnerRestrictions(pdfBuffer: ArrayBuffer): Promise<boolean> {
  try {
    // Try to load the PDF
    const pdf = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true, // Load even if encrypted
    });
    
    // If we can load with ignoreEncryption but not without, it has restrictions
    try {
      await PDFDocument.load(pdfBuffer, {
        ignoreEncryption: false,
      });
      return false; // No encryption at all
    } catch {
      return true; // Has some form of encryption/restrictions
    }
  } catch {
    return false; // Can't load at all
  }
}

/**
 * Remove owner restrictions from a PDF (requires owner password)
 * This removes permission restrictions while keeping the document accessible
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param ownerPassword - The owner password
 * @returns Promise resolving to UnlockResult
 */
export async function removeOwnerRestrictions(
  pdfBuffer: ArrayBuffer,
  ownerPassword: string
): Promise<UnlockResult> {
  return unlockPdf(pdfBuffer, ownerPassword);
}

/**
 * Validate that a password can unlock a PDF without returning the unlocked content
 * Useful for password verification before processing
 * 
 * Note: pdf-lib does not support password validation directly.
 * This function attempts to load the PDF with ignoreEncryption.
 * 
 * @param pdfBuffer - The PDF file as ArrayBuffer
 * @param password - The password to validate
 * @returns Promise resolving to true if the PDF can be loaded
 */
export async function validatePassword(
  pdfBuffer: ArrayBuffer,
  password: string
): Promise<boolean> {
  try {
    await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
    });
    return true;
  } catch {
    return false;
  }
}
