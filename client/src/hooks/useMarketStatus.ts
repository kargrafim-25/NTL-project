import { useState, useEffect } from 'react';

interface MarketStatus {
  isOpen: boolean;
  isLoading: boolean;
  error?: string;
}

export function useMarketStatus() {
  const [marketStatus, setMarketStatus] = useState<MarketStatus>({
    isOpen: false,
    isLoading: true
  });

  const checkMarketStatus = async () => {
    try {
      const response = await fetch('/api/v1/market-status', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMarketStatus({
          isOpen: data.isOpen,
          isLoading: false
        });
      } else {
        setMarketStatus({
          isOpen: false,
          isLoading: false,
          error: 'Failed to fetch market status'
        });
      }
    } catch (error) {
      setMarketStatus({
        isOpen: false,
        isLoading: false,
        error: 'Network error'
      });
    }
  };

  useEffect(() => {
    // Check immediately
    checkMarketStatus();

    // Check every 60 seconds
    const interval = setInterval(checkMarketStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  return marketStatus;
}