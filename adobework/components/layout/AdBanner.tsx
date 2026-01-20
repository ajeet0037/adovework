'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Supported ad sizes for Google AdSense
 * Based on common AdSense ad unit sizes
 */
export type AdSize = 
  | 'leaderboard'      // 728x90 - Top banner
  | 'large-leaderboard' // 970x90 - Large top banner
  | 'medium-rectangle' // 300x250 - Inline content
  | 'large-rectangle'  // 336x280 - Larger inline
  | 'half-page'        // 300x600 - Sidebar
  | 'mobile-banner'    // 320x50 - Mobile top
  | 'mobile-large'     // 320x100 - Mobile large
  | 'responsive';      // Auto-sizing

/**
 * Ad placement positions
 */
export type AdPosition = 'top' | 'inline' | 'after-result' | 'sidebar';

/**
 * Props for the AdBanner component
 */
export interface AdBannerProps {
  /** Google AdSense ad slot ID */
  adSlot?: string;
  /** Ad size preset */
  size?: AdSize;
  /** Position identifier for analytics */
  position?: AdPosition;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the ad (for premium user detection) */
  show?: boolean;
  /** Test mode - shows placeholder instead of real ads */
  testMode?: boolean;
}

/**
 * Ad size dimensions mapping
 */
const AD_SIZE_DIMENSIONS: Record<AdSize, { width: number | 'auto'; height: number | 'auto' }> = {
  'leaderboard': { width: 728, height: 90 },
  'large-leaderboard': { width: 970, height: 90 },
  'medium-rectangle': { width: 300, height: 250 },
  'large-rectangle': { width: 336, height: 280 },
  'half-page': { width: 300, height: 600 },
  'mobile-banner': { width: 320, height: 50 },
  'mobile-large': { width: 320, height: 100 },
  'responsive': { width: 'auto', height: 'auto' },
};

/**
 * Get the Google AdSense client ID from environment
 */
function getAdSenseClientId(): string | undefined {
  return process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
}

/**
 * AdBanner component for Google AdSense integration
 * 
 * Supports multiple ad sizes and positions with premium user detection.
 * In development/test mode, shows a placeholder instead of real ads.
 * 
 * Requirements: 8.1, 8.2
 * 
 * @example
 * ```tsx
 * // Top banner ad
 * <AdBanner position="top" size="leaderboard" adSlot="1234567890" />
 * 
 * // Inline content ad
 * <AdBanner position="inline" size="medium-rectangle" adSlot="0987654321" />
 * 
 * // Responsive ad
 * <AdBanner position="after-result" size="responsive" adSlot="1122334455" />
 * ```
 */
export function AdBanner({
  adSlot,
  size = 'responsive',
  position = 'inline',
  className = '',
  show = true,
  testMode = process.env.NODE_ENV === 'development',
}: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const clientId = getAdSenseClientId();
  const dimensions = AD_SIZE_DIMENSIONS[size];

  // Initialize AdSense ad
  useEffect(() => {
    if (!show || testMode || !clientId || !adSlot) {
      return;
    }

    try {
      // Push ad to AdSense
      const adsbygoogle = (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle;
      if (adsbygoogle) {
        adsbygoogle.push({});
        setIsLoaded(true);
      }
    } catch (error) {
      console.error('AdSense initialization error:', error);
      setHasError(true);
    }
  }, [show, testMode, clientId, adSlot]);

  // Don't render if ads should be hidden (premium users)
  if (!show) {
    return null;
  }

  // Calculate style based on size
  const containerStyle: React.CSSProperties = {
    display: 'block',
    textAlign: 'center',
    minHeight: dimensions.height === 'auto' ? '90px' : `${dimensions.height}px`,
    width: dimensions.width === 'auto' ? '100%' : `${dimensions.width}px`,
    maxWidth: '100%',
    margin: '0 auto',
  };

  // Render placeholder in test mode or development
  if (testMode || !clientId || !adSlot) {
    return (
      <div
        ref={adRef}
        className={`ad-banner ad-banner-${position} ad-banner-${size} ${className}`}
        data-ad-position={position}
        data-ad-size={size}
        aria-hidden="true"
        style={containerStyle}
      >
        <div className="bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center h-full min-h-[90px]">
          <div className="text-center p-4">
            <span className="sr-only">Advertisement placeholder</span>
            <div className="text-gray-400 text-sm">
              <div className="font-medium">Ad Placement</div>
              <div className="text-xs mt-1">
                {position} • {size}
                {dimensions.width !== 'auto' && ` • ${dimensions.width}x${dimensions.height}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render actual AdSense ad
  return (
    <div
      ref={adRef}
      className={`ad-banner ad-banner-${position} ad-banner-${size} ${className}`}
      data-ad-position={position}
      data-ad-size={size}
      aria-hidden="true"
      style={containerStyle}
    >
      {hasError ? (
        // Error fallback - empty space
        <div style={{ minHeight: dimensions.height === 'auto' ? '90px' : `${dimensions.height}px` }} />
      ) : (
        <ins
          className="adsbygoogle"
          style={{
            display: 'block',
            width: dimensions.width === 'auto' ? '100%' : `${dimensions.width}px`,
            height: dimensions.height === 'auto' ? 'auto' : `${dimensions.height}px`,
          }}
          data-ad-client={clientId}
          data-ad-slot={adSlot}
          data-ad-format={size === 'responsive' ? 'auto' : undefined}
          data-full-width-responsive={size === 'responsive' ? 'true' : undefined}
        />
      )}
    </div>
  );
}

/**
 * Responsive ad banner that automatically adjusts to container width
 * Useful for tool pages where layout varies
 */
export function ResponsiveAdBanner({
  adSlot,
  position = 'inline',
  className = '',
  show = true,
}: Omit<AdBannerProps, 'size'>) {
  return (
    <AdBanner
      adSlot={adSlot}
      size="responsive"
      position={position}
      className={className}
      show={show}
    />
  );
}

/**
 * Top banner ad component - optimized for page headers
 * Uses leaderboard size on desktop, mobile banner on mobile
 */
export function TopBannerAd({
  adSlot,
  className = '',
  show = true,
}: Omit<AdBannerProps, 'size' | 'position'>) {
  return (
    <div className={`hidden sm:block ${className}`}>
      <AdBanner
        adSlot={adSlot}
        size="leaderboard"
        position="top"
        show={show}
      />
    </div>
  );
}

/**
 * Mobile banner ad component - optimized for mobile devices
 */
export function MobileBannerAd({
  adSlot,
  className = '',
  show = true,
}: Omit<AdBannerProps, 'size' | 'position'>) {
  return (
    <div className={`sm:hidden ${className}`}>
      <AdBanner
        adSlot={adSlot}
        size="mobile-banner"
        position="top"
        show={show}
      />
    </div>
  );
}

/**
 * Inline content ad - for placement within content sections
 */
export function InlineAd({
  adSlot,
  className = '',
  show = true,
}: Omit<AdBannerProps, 'size' | 'position'>) {
  return (
    <AdBanner
      adSlot={adSlot}
      size="medium-rectangle"
      position="inline"
      className={className}
      show={show}
    />
  );
}

/**
 * After result ad - for placement after conversion results
 */
export function AfterResultAd({
  adSlot,
  className = '',
  show = true,
}: Omit<AdBannerProps, 'size' | 'position'>) {
  return (
    <AdBanner
      adSlot={adSlot}
      size="large-rectangle"
      position="after-result"
      className={className}
      show={show}
    />
  );
}

export default AdBanner;
