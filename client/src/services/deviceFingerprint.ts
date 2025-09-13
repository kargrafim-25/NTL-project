export interface DeviceFingerprint {
  deviceId: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: boolean;
  canvasFingerprint: string;
  webglFingerprint: string;
  audioFingerprint: string;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  connectionType: string;
  memorySize?: number;
  devicePixelRatio: number;
  colorDepth: number;
}

class DeviceFingerprintService {
  private async generateDeviceId(): Promise<string> {
    // Combine multiple device characteristics to create a unique device ID
    const components = [
      navigator.userAgent,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      navigator.language,
      navigator.platform,
      navigator.hardwareConcurrency,
      navigator.maxTouchPoints,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      this.getCanvasFingerprint(),
      this.getWebGLFingerprint(),
      await this.getAudioFingerprint()
    ];

    // Create a hash of all components
    const combined = components.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private getBrowserInfo(): { browser: string; browserVersion: string } {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      return { browser: 'Chrome', browserVersion: match ? match[1] : 'unknown' };
    } else if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/);
      return { browser: 'Firefox', browserVersion: match ? match[1] : 'unknown' };
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/(\d+)/);
      return { browser: 'Safari', browserVersion: match ? match[1] : 'unknown' };
    } else if (userAgent.includes('Edg')) {
      const match = userAgent.match(/Edg\/(\d+)/);
      return { browser: 'Edge', browserVersion: match ? match[1] : 'unknown' };
    }
    
    return { browser: 'Unknown', browserVersion: 'unknown' };
  }

  private getOSInfo(): { os: string; osVersion: string } {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Windows NT')) {
      const match = userAgent.match(/Windows NT (\d+\.\d+)/);
      const version = match ? match[1] : 'unknown';
      return { os: 'Windows', osVersion: version };
    } else if (userAgent.includes('Mac OS X')) {
      const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
      const version = match ? match[1].replace(/_/g, '.') : 'unknown';
      return { os: 'macOS', osVersion: version };
    } else if (userAgent.includes('Linux')) {
      return { os: 'Linux', osVersion: 'unknown' };
    } else if (userAgent.includes('Android')) {
      const match = userAgent.match(/Android (\d+\.\d+)/);
      const version = match ? match[1] : 'unknown';
      return { os: 'Android', osVersion: version };
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      const match = userAgent.match(/OS (\d+_\d+)/);
      const version = match ? match[1].replace(/_/g, '.') : 'unknown';
      return { os: 'iOS', osVersion: version };
    }
    
    return { os: 'Unknown', osVersion: 'unknown' };
  }

  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'unavailable';

      // Draw some text and shapes to create a unique fingerprint
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Security fingerprint 🔒', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Next Trading Labs', 4, 45);

      return canvas.toDataURL().slice(-100); // Last 100 chars for efficiency
    } catch (e) {
      return 'error';
    }
  }

  private getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      if (!gl) return 'unavailable';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return 'no-debug-info';

      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      return `${vendor}_${renderer}`.slice(0, 100); // Truncate for efficiency
    } catch (e) {
      return 'error';
    }
  }

  private async getAudioFingerprint(): Promise<string> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gain = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

      gain.gain.value = 0; // Mute the audio
      oscillator.type = 'triangle';
      oscillator.frequency.value = 10000;

      oscillator.connect(gain);
      gain.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      return new Promise((resolve) => {
        scriptProcessor.onaudioprocess = (event) => {
          const buffer = event.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) {
            sum += Math.abs(buffer[i]);
          }
          
          audioContext.close();
          resolve(sum.toString().slice(0, 20));
        };

        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          resolve('timeout');
        }, 100);
      });
    } catch (e) {
      return 'error';
    }
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      return connection.effectiveType || connection.type || 'unknown';
    }
    return 'unknown';
  }

  private getMemorySize(): number | undefined {
    return (navigator as any).deviceMemory;
  }

  async generateFingerprint(): Promise<DeviceFingerprint> {
    const { browser, browserVersion } = this.getBrowserInfo();
    const { os, osVersion } = this.getOSInfo();
    
    const fingerprint: DeviceFingerprint = {
      deviceId: await this.generateDeviceId(),
      browser,
      browserVersion,
      os,
      osVersion,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === '1',
      canvasFingerprint: this.getCanvasFingerprint(),
      webglFingerprint: this.getWebGLFingerprint(),
      audioFingerprint: await this.getAudioFingerprint(),
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      connectionType: this.getConnectionType(),
      memorySize: this.getMemorySize(),
      devicePixelRatio: window.devicePixelRatio || 1,
      colorDepth: screen.colorDepth || 24
    };

    return fingerprint;
  }

  // Store fingerprint in localStorage for consistency across sessions
  async getOrCreateFingerprint(): Promise<DeviceFingerprint> {
    const stored = localStorage.getItem('device_fingerprint');
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Verify it's still valid (less than 30 days old)
        const created = new Date(parsed.created || 0);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        if (created > thirtyDaysAgo && parsed.fingerprint) {
          return parsed.fingerprint;
        }
      } catch (e) {
        // Invalid stored data, regenerate
      }
    }

    // Generate new fingerprint
    const fingerprint = await this.generateFingerprint();
    
    // Store with timestamp
    localStorage.setItem('device_fingerprint', JSON.stringify({
      fingerprint,
      created: new Date().toISOString()
    }));

    return fingerprint;
  }

  // Compare two fingerprints to detect if they're from the same device
  compareFingerprints(fp1: DeviceFingerprint, fp2: DeviceFingerprint): number {
    const weights = {
      deviceId: 0.4,
      screenResolution: 0.15,
      canvasFingerprint: 0.15,
      webglFingerprint: 0.1,
      audioFingerprint: 0.05,
      browser: 0.05,
      platform: 0.05,
      timezone: 0.05
    };

    let score = 0;
    
    if (fp1.deviceId === fp2.deviceId) score += weights.deviceId;
    if (fp1.screenResolution === fp2.screenResolution) score += weights.screenResolution;
    if (fp1.canvasFingerprint === fp2.canvasFingerprint) score += weights.canvasFingerprint;
    if (fp1.webglFingerprint === fp2.webglFingerprint) score += weights.webglFingerprint;
    if (fp1.audioFingerprint === fp2.audioFingerprint) score += weights.audioFingerprint;
    if (fp1.browser === fp2.browser) score += weights.browser;
    if (fp1.platform === fp2.platform) score += weights.platform;
    if (fp1.timezone === fp2.timezone) score += weights.timezone;

    return score; // Returns 0-1, where 1 is identical
  }
}

export const deviceFingerprintService = new DeviceFingerprintService();