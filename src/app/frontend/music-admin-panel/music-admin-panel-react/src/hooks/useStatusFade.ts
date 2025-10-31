import { useState, useEffect, useRef } from 'react';

/**
 * Hook for managing status message fade-out animation
 * Automatically fades out status messages after a specified duration
 */
export function useStatusFade(status: string | null, fadeOutDelay = 3000) {
  const [shouldFadeOut, setShouldFadeOut] = useState(false);
  const statusTimeoutRef = useRef<number | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  // Set up fade-out effect when status changes
  useEffect(() => {
    if (status) {
      // Reset fade state
      setShouldFadeOut(false);

      // Clear any existing timeout
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }

      // Set timeout to fade out after specified delay
      statusTimeoutRef.current = window.setTimeout(() => {
        setShouldFadeOut(true);
      }, fadeOutDelay);
    }
  }, [status, fadeOutDelay]);

  return shouldFadeOut;
}

