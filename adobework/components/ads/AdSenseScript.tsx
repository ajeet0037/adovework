'use client';

import { useEffect, useRef } from 'react';

/**
 * Lazy loads AdSense script after page becomes interactive
 * Delays loading to improve LCP and FCP scores
 */
export function AdSenseScript() {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;

    const loadAdsense = () => {
      if (loadedRef.current || document.querySelector('script[src*="adsbygoogle"]')) {
        loadedRef.current = true;
        return;
      }

      loadedRef.current = true;
      
      // Get AdSense ID from environment variable
      const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
      if (!adsenseId) {
        console.warn('AdSense ID not configured');
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    };

    // Load after 5 seconds or on user interaction (whichever comes first)
    const timer = setTimeout(loadAdsense, 5000);
    
    const handleInteraction = () => {
      clearTimeout(timer);
      // Small delay even on interaction to not block main thread
      setTimeout(loadAdsense, 100);
    };

    window.addEventListener('scroll', handleInteraction, { once: true, passive: true });
    window.addEventListener('click', handleInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', handleInteraction, { once: true, passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  return null;
}

export default AdSenseScript;
