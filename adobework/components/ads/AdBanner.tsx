'use client';

import { useEffect, useRef, useState } from 'react';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

/**
 * Google AdSense Banner Component
 * Usage: <AdBanner slot="1234567890" format="auto" responsive />
 */
export function AdBanner({ slot, format = 'auto', responsive = true, className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (isLoaded.current) return;
    
    try {
      if (typeof window !== 'undefined' && adRef.current) {
        // Check if this ad slot already has an ad
        if (!adRef.current.getAttribute('data-adsbygoogle-status')) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isLoaded.current = true;
          
          // Check if ad loaded successfully after a delay
          setTimeout(() => {
            if (adRef.current && !adRef.current.getAttribute('data-adsbygoogle-status')) {
              setAdError(true);
            }
          }, 3000);
        }
      }
    } catch (err) {
      setAdError(true);
      console.warn('AdSense failed to load:', err);
    }
  }, []);

  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  
  // Don't render if no AdSense ID configured
  if (!adsenseId) {
    return null;
  }

  return (
    <div className={`ad-container ${className}`}>
      {adError ? (
        <div className="text-center text-sm text-gray-400 py-4">
          {/* Silent fallback - no visible error to users */}
        </div>
      ) : (
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adsenseId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      )}
    </div>
  );
}

/**
 * In-Article Ad - Best for between content sections
 */
export function InArticleAd({ slot, className = '' }: { slot: string; className?: string }) {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (isLoaded.current) return;
    
    try {
      if (typeof window !== 'undefined' && adRef.current) {
        if (!adRef.current.getAttribute('data-adsbygoogle-status')) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isLoaded.current = true;
        }
      }
    } catch (err) {
      setAdError(true);
    }
  }, []);

  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  
  if (!adsenseId || adError) {
    return null;
  }

  return (
    <div className={`ad-container my-6 ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client={adsenseId}
        data-ad-slot={slot}
      />
    </div>
  );
}

/**
 * Multiplex Ad - Grid of recommended content ads
 */
export function MultiplexAd({ slot, className = '' }: { slot: string; className?: string }) {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (isLoaded.current) return;
    
    try {
      if (typeof window !== 'undefined' && adRef.current) {
        if (!adRef.current.getAttribute('data-adsbygoogle-status')) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isLoaded.current = true;
        }
      }
    } catch (err) {
      setAdError(true);
    }
  }, []);

  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  
  if (!adsenseId || adError) {
    return null;
  }

  return (
    <div className={`ad-container my-8 ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-format="autorelaxed"
        data-ad-client={adsenseId}
        data-ad-slot={slot}
      />
    </div>
  );
}

export default AdBanner;
