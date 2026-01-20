/**
 * Environment variable validation and configuration
 * Validates required environment variables on startup
 */

interface EnvConfig {
  // Optional variables (with defaults)
  NODE_ENV: string;
  TEMP_DIR?: string;

  // Optional public variables
  NEXT_PUBLIC_BASE_URL?: string;
  NEXT_PUBLIC_GA_ID?: string;
  NEXT_PUBLIC_AD_SLOT_HEADER?: string;
  NEXT_PUBLIC_AD_SLOT_FOOTER?: string;

  // Required for cleanup API
  CLEANUP_SECRET?: string;
}

/**
 * Validate environment variables
 * Throws error if required variables are missing
 */
export function validateEnv(): void {
  const errors: string[] = [];

  // Check NODE_ENV - Next.js sets this automatically
  // We just validate it exists, don't try to assign (it's readonly)

  // Validate CLEANUP_SECRET in production
  if (process.env.NODE_ENV === 'production' && !process.env.CLEANUP_SECRET) {
    errors.push('CLEANUP_SECRET is required in production');
  }

  // Validate TEMP_DIR if provided
  if (process.env.TEMP_DIR) {
    try {
      const fs = require('fs');
      const path = require('path');
      const tempDir = path.resolve(process.env.TEMP_DIR);

      // Try to create directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Check if it's writable
      try {
        const testFile = path.join(tempDir, '.test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch {
        errors.push(`TEMP_DIR (${tempDir}) is not writable`);
      }
    } catch (error) {
      errors.push(`Invalid TEMP_DIR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Get environment configuration with type safety
 */
export function getEnvConfig(): EnvConfig {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    TEMP_DIR: process.env.TEMP_DIR,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_AD_SLOT_HEADER: process.env.NEXT_PUBLIC_AD_SLOT_HEADER,
    NEXT_PUBLIC_AD_SLOT_FOOTER: process.env.NEXT_PUBLIC_AD_SLOT_FOOTER,
    CLEANUP_SECRET: process.env.CLEANUP_SECRET,
  };
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get required environment variable or throw error
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Get optional environment variable with default
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

