'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Premium user status interface
 */
export interface PremiumStatus {
  /** Whether the user has premium status */
  isPremium: boolean;
  /** Premium tier level (if applicable) */
  tier?: 'basic' | 'pro' | 'enterprise';
  /** Premium expiration date (if applicable) */
  expiresAt?: Date;
  /** Whether the status is still loading */
  isLoading: boolean;
  /** Any error that occurred while checking status */
  error?: string;
}

/**
 * Options for the usePremiumStatus hook
 */
export interface UsePremiumStatusOptions {
  /** Whether to check status on mount (default: true) */
  checkOnMount?: boolean;
  /** Custom storage key for premium status */
  storageKey?: string;
}

/**
 * Return type for the usePremiumStatus hook
 */
export interface UsePremiumStatusReturn extends PremiumStatus {
  /** Manually refresh the premium status */
  refresh: () => Promise<void>;
  /** Set premium status (for testing/development) */
  setPremiumStatus: (isPremium: boolean) => void;
}

const DEFAULT_STORAGE_KEY = 'adobework_premium_status';

/**
 * Hook to check and manage premium user status
 * 
 * This hook provides premium user detection for:
 * - Hiding ads for premium users (Requirement 8.5)
 * - Enabling larger file size limits (Requirement 8.6)
 * - Enabling faster processing speeds (Requirement 8.7)
 * 
 * In a production environment, this would integrate with:
 * - Authentication system (e.g., NextAuth, Clerk)
 * - Payment provider (e.g., Stripe)
 * - Backend API for subscription status
 * 
 * For now, it uses localStorage for development/testing purposes.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isPremium, isLoading } = usePremiumStatus();
 *   
 *   if (isLoading) return <Loading />;
 *   
 *   return isPremium ? <PremiumContent /> : <FreeContent />;
 * }
 * ```
 */
export function usePremiumStatus(
  options: UsePremiumStatusOptions = {}
): UsePremiumStatusReturn {
  const { 
    checkOnMount = true, 
    storageKey = DEFAULT_STORAGE_KEY 
  } = options;

  const [status, setStatus] = useState<PremiumStatus>({
    isPremium: false,
    isLoading: true,
    tier: undefined,
    expiresAt: undefined,
    error: undefined,
  });

  /**
   * Check premium status from storage or API
   */
  const checkPremiumStatus = useCallback(async () => {
    setStatus(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      // In production, this would call an API endpoint
      // For now, check localStorage for development/testing
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt) : undefined;
            
            // Check if premium has expired
            const isExpired = expiresAt && expiresAt < new Date();
            
            setStatus({
              isPremium: !isExpired && parsed.isPremium === true,
              tier: parsed.tier,
              expiresAt,
              isLoading: false,
              error: undefined,
            });
            return;
          } catch {
            // Invalid stored data, continue with default
          }
        }
      }

      // Default: not premium
      setStatus({
        isPremium: false,
        isLoading: false,
        tier: undefined,
        expiresAt: undefined,
        error: undefined,
      });
    } catch (error) {
      setStatus({
        isPremium: false,
        isLoading: false,
        tier: undefined,
        expiresAt: undefined,
        error: error instanceof Error ? error.message : 'Failed to check premium status',
      });
    }
  }, [storageKey]);

  /**
   * Set premium status (for testing/development)
   */
  const setPremiumStatus = useCallback((isPremium: boolean, tier?: 'basic' | 'pro' | 'enterprise') => {
    if (typeof window !== 'undefined') {
      const data = {
        isPremium,
        tier: tier || (isPremium ? 'basic' : undefined),
        expiresAt: isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      setStatus({
        isPremium,
        tier: data.tier,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        isLoading: false,
        error: undefined,
      });
    }
  }, [storageKey]);

  /**
   * Refresh premium status
   */
  const refresh = useCallback(async () => {
    await checkPremiumStatus();
  }, [checkPremiumStatus]);

  // Check status on mount
  useEffect(() => {
    if (checkOnMount) {
      checkPremiumStatus();
    }
  }, [checkOnMount, checkPremiumStatus]);

  return {
    ...status,
    refresh,
    setPremiumStatus,
  };
}

/**
 * Get premium file size limit based on status
 * 
 * @param isPremium - Whether the user has premium status
 * @returns Maximum file size in bytes
 */
export function getPremiumFileLimit(isPremium: boolean): number {
  // Free: 50MB, Premium: 500MB
  return isPremium ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
}

/**
 * Get premium daily conversion limit based on status
 * 
 * @param isPremium - Whether the user has premium status
 * @returns Maximum daily conversions (Infinity for premium)
 */
export function getPremiumDailyLimit(isPremium: boolean): number {
  // Free: 20 conversions, Premium: unlimited
  return isPremium ? Infinity : 20;
}

export default usePremiumStatus;
