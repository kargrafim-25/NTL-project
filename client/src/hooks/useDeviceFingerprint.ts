import { useState, useEffect } from 'react';
import { deviceFingerprintService, type DeviceFingerprint } from '@/services/deviceFingerprint';

interface UseDeviceFingerprintResult {
  fingerprint: DeviceFingerprint | null;
  isLoading: boolean;
  error: string | null;
  refreshFingerprint: () => Promise<void>;
}

export function useDeviceFingerprint(): UseDeviceFingerprintResult {
  const [fingerprint, setFingerprint] = useState<DeviceFingerprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateFingerprint = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fp = await deviceFingerprintService.getOrCreateFingerprint();
      setFingerprint(fp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate device fingerprint');
      console.error('Device fingerprinting error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateFingerprint();
  }, []);

  const refreshFingerprint = async () => {
    // Clear stored fingerprint and regenerate
    localStorage.removeItem('device_fingerprint');
    await generateFingerprint();
  };

  return {
    fingerprint,
    isLoading,
    error,
    refreshFingerprint
  };
}

// Hook for device tracking in authentication flows
export function useDeviceTracking() {
  const { fingerprint } = useDeviceFingerprint();

  const trackDeviceAction = async (action: string, additionalData?: Record<string, any>) => {
    if (!fingerprint) return null;

    const trackingData = {
      action,
      timestamp: new Date().toISOString(),
      deviceId: fingerprint.deviceId,
      browser: `${fingerprint.browser} ${fingerprint.browserVersion}`,
      os: `${fingerprint.os} ${fingerprint.osVersion}`,
      screenResolution: fingerprint.screenResolution,
      timezone: fingerprint.timezone,
      language: fingerprint.language,
      ...additionalData
    };

    // Send to backend for logging
    try {
      await fetch('/api/tracking/device-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trackingData),
        credentials: 'include'
      });
    } catch (error) {
      console.warn('Failed to track device action:', error);
    }

    return trackingData;
  };

  return {
    fingerprint,
    trackDeviceAction
  };
}