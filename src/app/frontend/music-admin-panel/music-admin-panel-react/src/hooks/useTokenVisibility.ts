import { useState, useCallback } from 'react';

/**
 * Hook for managing token visibility state
 * Provides functionality to show/hide sensitive token values
 */
export function useTokenVisibility() {
  const [isTokenVisible, setIsTokenVisible] = useState(false);

  const toggleTokenVisibility = useCallback(() => {
    setIsTokenVisible(prev => !prev);
  }, []);

  const hideToken = useCallback(() => {
    setIsTokenVisible(false);
  }, []);

  const showToken = useCallback(() => {
    setIsTokenVisible(true);
  }, []);

  /**
   * Masks a token, showing only the first 10 characters
   */
  const getMaskedToken = useCallback((fullToken: string): string => {
    if (!fullToken) return "";
    const visiblePart = fullToken.substring(0, 10);
    const maskedPart = "••••••••••••••••••••••••••••••••••••";
    return visiblePart + maskedPart;
  }, []);

  return {
    isTokenVisible,
    toggleTokenVisibility,
    hideToken,
    showToken,
    getMaskedToken,
  };
}

