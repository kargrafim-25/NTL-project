interface SessionInfo {
  userId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  lastActive: Date;
  deviceFingerprint?: any;
}

interface SharingDetectionResult {
  isSharing: boolean;
  reason: string;
  confidence: number; // 0-1, where 1 is definitely sharing
  activeSessions: number;
  suspiciousDevices: string[];
  enforcement?: {
    action: 'allow' | 'warn' | 'restrict' | 'terminate';
    sessionsTerminated?: number;
    blocked?: boolean;
  };
}

class SharingDetectionService {
  private readonly MAX_ALLOWED_SESSIONS = 2; // Allow up to 2 simultaneous sessions
  private readonly SESSION_TIMEOUT_HOURS = 24; // Consider sessions inactive after 24 hours
  private readonly DEVICE_SIMILARITY_THRESHOLD = 0.7; // Device fingerprints similarity threshold

  async detectSharing(userId: string, currentDeviceId: string, storage: any): Promise<SharingDetectionResult> {
    try {
      // Get all recent sessions for this user
      const recentSessions = await this.getRecentUserSessions(userId, storage);
      
      // Filter out expired sessions
      const activeSessions = this.filterActiveSessions(recentSessions);
      
      // Analyze device patterns
      const deviceAnalysis = this.analyzeDevicePatterns(activeSessions, currentDeviceId);
      
      // Check for simultaneous sessions from different locations/devices
      const simultaneousAnalysis = this.analyzeSimultaneousAccess(activeSessions);
      
      // Calculate sharing confidence score
      const confidence = this.calculateSharingConfidence(deviceAnalysis, simultaneousAnalysis, activeSessions.length);
      
      return {
        isSharing: confidence > 0.6 || activeSessions.length > this.MAX_ALLOWED_SESSIONS,
        reason: this.generateSharingReason(deviceAnalysis, simultaneousAnalysis, activeSessions.length),
        confidence,
        activeSessions: activeSessions.length,
        suspiciousDevices: deviceAnalysis.suspiciousDevices
      };
    } catch (error) {
      console.error('Error detecting sharing:', error);
      return {
        isSharing: false,
        reason: 'Error analyzing sessions',
        confidence: 0,
        activeSessions: 0,
        suspiciousDevices: []
      };
    }
  }

  private async getRecentUserSessions(userId: string, storage: any): Promise<SessionInfo[]> {
    // Get sessions from the last 24 hours
    const cutoffTime = new Date(Date.now() - this.SESSION_TIMEOUT_HOURS * 60 * 60 * 1000);
    
    // This would typically query the user_sessions table
    // For now, we'll use the storage interface we have
    const sessions = await storage.getUserSessions(userId, cutoffTime);
    return sessions || [];
  }

  private filterActiveSessions(sessions: SessionInfo[]): SessionInfo[] {
    const now = new Date();
    const activeThreshold = new Date(now.getTime() - this.SESSION_TIMEOUT_HOURS * 60 * 60 * 1000);
    
    return sessions.filter(session => 
      new Date(session.lastActive) > activeThreshold
    );
  }

  private analyzeDevicePatterns(sessions: SessionInfo[], currentDeviceId: string) {
    const uniqueDevices = new Set(sessions.map(s => s.deviceId));
    const uniqueIPs = new Set(sessions.map(s => s.ipAddress));
    const userAgents = sessions.map(s => s.userAgent);
    
    // Check for similar device fingerprints that might indicate device spoofing
    const suspiciousDevices: string[] = [];
    const deviceGroups = this.groupSimilarDevices(sessions);
    
    // If we have too many similar devices, it might be spoofing
    for (const group of deviceGroups) {
      if (group.length > 1 && group.some(s => s.deviceId !== currentDeviceId)) {
        suspiciousDevices.push(...group.map(s => s.deviceId));
      }
    }

    return {
      uniqueDeviceCount: uniqueDevices.size,
      uniqueIPCount: uniqueIPs.size,
      userAgentVariations: this.analyzeUserAgentVariations(userAgents),
      suspiciousDevices,
      hasCurrentDevice: uniqueDevices.has(currentDeviceId)
    };
  }

  private groupSimilarDevices(sessions: SessionInfo[]): SessionInfo[][] {
    const groups: SessionInfo[][] = [];
    const processed = new Set<string>();

    for (const session of sessions) {
      if (processed.has(session.deviceId)) continue;

      const similarSessions = [session];
      processed.add(session.deviceId);

      // Find similar sessions based on device fingerprint similarity
      for (const otherSession of sessions) {
        if (otherSession.deviceId === session.deviceId || processed.has(otherSession.deviceId)) {
          continue;
        }

        const similarity = this.calculateDeviceSimilarity(session, otherSession);
        if (similarity > this.DEVICE_SIMILARITY_THRESHOLD) {
          similarSessions.push(otherSession);
          processed.add(otherSession.deviceId);
        }
      }

      groups.push(similarSessions);
    }

    return groups;
  }

  private calculateDeviceSimilarity(session1: SessionInfo, session2: SessionInfo): number {
    let score = 0;
    let factors = 0;

    // Compare user agents
    if (session1.userAgent === session2.userAgent) {
      score += 0.4;
    } else if (this.areSimilarUserAgents(session1.userAgent, session2.userAgent)) {
      score += 0.2;
    }
    factors++;

    // Compare IP addresses (same IP = higher similarity)
    if (session1.ipAddress === session2.ipAddress) {
      score += 0.3;
    } else if (this.areSimilarIPs(session1.ipAddress, session2.ipAddress)) {
      score += 0.1;
    }
    factors++;

    // If we have device fingerprint data, use it
    if (session1.deviceFingerprint && session2.deviceFingerprint) {
      const fingerprintSimilarity = this.compareDeviceFingerprints(
        session1.deviceFingerprint,
        session2.deviceFingerprint
      );
      score += fingerprintSimilarity * 0.3;
      factors++;
    }

    return score / factors;
  }

  private areSimilarUserAgents(ua1: string, ua2: string): boolean {
    // Extract browser and OS information
    const extractFeatures = (ua: string) => {
      const browser = ua.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)?.[0] || '';
      const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/)?.[0] || '';
      return { browser, os };
    };

    const features1 = extractFeatures(ua1);
    const features2 = extractFeatures(ua2);

    return features1.browser === features2.browser && features1.os === features2.os;
  }

  private areSimilarIPs(ip1: string, ip2: string): boolean {
    // Check if IPs are in the same subnet (simple check)
    const parts1 = ip1.split('.');
    const parts2 = ip2.split('.');
    
    if (parts1.length === 4 && parts2.length === 4) {
      // Same /24 subnet
      return parts1.slice(0, 3).join('.') === parts2.slice(0, 3).join('.');
    }
    
    return false;
  }

  private compareDeviceFingerprints(fp1: any, fp2: any): number {
    if (!fp1 || !fp2) return 0;

    let matches = 0;
    let total = 0;

    const compareFields = [
      'browser', 'os', 'screenResolution', 'timezone', 
      'language', 'platform', 'canvasFingerprint',
      'webglFingerprint', 'hardwareConcurrency'
    ];

    for (const field of compareFields) {
      if (fp1[field] && fp2[field]) {
        total++;
        if (fp1[field] === fp2[field]) {
          matches++;
        }
      }
    }

    return total > 0 ? matches / total : 0;
  }

  private analyzeUserAgentVariations(userAgents: string[]) {
    const uniqueUAs = new Set(userAgents);
    const browsers = new Set();
    const operatingSystems = new Set();

    for (const ua of userAgents) {
      // Extract browser
      const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge)/);
      if (browserMatch) browsers.add(browserMatch[1]);

      // Extract OS
      const osMatch = ua.match(/(Windows|Mac|Linux|Android|iOS)/);
      if (osMatch) operatingSystems.add(osMatch[1]);
    }

    return {
      uniqueUserAgents: uniqueUAs.size,
      uniqueBrowsers: browsers.size,
      uniqueOperatingSystems: operatingSystems.size
    };
  }

  private analyzeSimultaneousAccess(sessions: SessionInfo[]) {
    // Group sessions by time windows (5-minute intervals)
    const timeWindows = new Map<string, SessionInfo[]>();
    
    for (const session of sessions) {
      const windowKey = this.getTimeWindowKey(session.lastActive, 5); // 5-minute windows
      if (!timeWindows.has(windowKey)) {
        timeWindows.set(windowKey, []);
      }
      timeWindows.get(windowKey)!.push(session);
    }

    // Find windows with multiple sessions from different devices/IPs
    let simultaneousWindowsCount = 0;
    let maxSimultaneousSessions = 0;

    Array.from(timeWindows.entries()).forEach(([window, windowSessions]) => {
      const uniqueDevices = new Set(windowSessions.map((s: SessionInfo) => s.deviceId));
      const uniqueIPs = new Set(windowSessions.map((s: SessionInfo) => s.ipAddress));
      
      if (uniqueDevices.size > 1 || uniqueIPs.size > 1) {
        simultaneousWindowsCount++;
        maxSimultaneousSessions = Math.max(maxSimultaneousSessions, windowSessions.length);
      }
    });

    return {
      simultaneousWindowsCount,
      maxSimultaneousSessions,
      totalTimeWindows: timeWindows.size
    };
  }

  private getTimeWindowKey(date: Date, intervalMinutes: number): string {
    const time = new Date(date);
    const minutes = Math.floor(time.getMinutes() / intervalMinutes) * intervalMinutes;
    time.setMinutes(minutes, 0, 0);
    return time.toISOString();
  }

  private calculateSharingConfidence(
    deviceAnalysis: any,
    simultaneousAnalysis: any,
    sessionCount: number
  ): number {
    let confidence = 0;

    // Multiple unique devices increases confidence
    if (deviceAnalysis.uniqueDeviceCount > 2) {
      confidence += 0.3;
    }

    // Multiple unique IPs increases confidence
    if (deviceAnalysis.uniqueIPCount > 2) {
      confidence += 0.2;
    }

    // Simultaneous access from different devices
    if (simultaneousAnalysis.simultaneousWindowsCount > 0) {
      confidence += 0.4;
    }

    // Too many sessions
    if (sessionCount > this.MAX_ALLOWED_SESSIONS) {
      confidence += 0.5;
    }

    // Multiple browser/OS combinations
    if (deviceAnalysis.userAgentVariations.uniqueBrowsers > 2) {
      confidence += 0.2;
    }

    if (deviceAnalysis.userAgentVariations.uniqueOperatingSystems > 2) {
      confidence += 0.3;
    }

    // Suspicious device fingerprint similarity
    if (deviceAnalysis.suspiciousDevices.length > 0) {
      confidence += 0.6;
    }

    return Math.min(confidence, 1.0); // Cap at 1.0
  }

  private generateSharingReason(
    deviceAnalysis: any,
    simultaneousAnalysis: any,
    sessionCount: number
  ): string {
    const reasons: string[] = [];

    if (sessionCount > this.MAX_ALLOWED_SESSIONS) {
      reasons.push(`Too many active sessions (${sessionCount}/${this.MAX_ALLOWED_SESSIONS})`);
    }

    if (deviceAnalysis.uniqueDeviceCount > 2) {
      reasons.push(`Multiple devices detected (${deviceAnalysis.uniqueDeviceCount})`);
    }

    if (deviceAnalysis.uniqueIPCount > 2) {
      reasons.push(`Multiple IP addresses (${deviceAnalysis.uniqueIPCount})`);
    }

    if (simultaneousAnalysis.simultaneousWindowsCount > 0) {
      reasons.push('Simultaneous access from different locations');
    }

    if (deviceAnalysis.suspiciousDevices.length > 0) {
      reasons.push('Similar device fingerprints detected');
    }

    if (deviceAnalysis.userAgentVariations.uniqueBrowsers > 2) {
      reasons.push(`Multiple browsers (${deviceAnalysis.userAgentVariations.uniqueBrowsers})`);
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Unusual access patterns detected';
  }

  // Policy enforcement methods with actual prevention
  async enforcePolicy(
    userId: string,
    detectionResult: SharingDetectionResult,
    storage: any
  ): Promise<{ action: string; message: string; blocked?: boolean; sessionsTerminated?: number }> {
    if (!detectionResult.isSharing) {
      return { action: 'allow', message: 'Normal usage detected' };
    }

    // Log the detection for auditing
    await storage.logSuspiciousActivity(userId, 'account_sharing', {
      confidence: detectionResult.confidence,
      reason: detectionResult.reason,
      activeSessions: detectionResult.activeSessions
    });

    let sessionsTerminated = 0;
    let blocked = false;

    // Determine action based on confidence level with actual enforcement
    if (detectionResult.confidence >= 0.8) {
      // High confidence - terminate all sessions and block current request
      console.log(`[SHARING-ENFORCEMENT] High confidence sharing detected for user ${userId}. Terminating all sessions.`);
      await storage.terminateAllUserSessions(userId);
      blocked = true;
      
      await storage.logSuspiciousActivity(userId, 'sharing_blocked_high_confidence', {
        confidence: detectionResult.confidence,
        action: 'all_sessions_terminated_and_blocked'
      });
      
      return {
        action: 'terminate',
        message: 'Account sharing detected with high confidence. All sessions have been terminated. Please log in again and use only one device.',
        blocked: true,
        sessionsTerminated: detectionResult.activeSessions
      };
    } else if (detectionResult.confidence >= 0.6 || detectionResult.activeSessions > this.MAX_ALLOWED_SESSIONS) {
      // Medium confidence or too many sessions - terminate oldest sessions
      console.log(`[SHARING-ENFORCEMENT] Medium confidence sharing or session limit exceeded for user ${userId}. Terminating oldest sessions.`);
      
      const originalSessions = detectionResult.activeSessions;
      await storage.terminateOldestUserSessions(userId, this.MAX_ALLOWED_SESSIONS);
      sessionsTerminated = Math.max(0, originalSessions - this.MAX_ALLOWED_SESSIONS);
      
      await storage.logSuspiciousActivity(userId, 'sharing_sessions_limited', {
        confidence: detectionResult.confidence,
        sessionsTerminated,
        action: 'oldest_sessions_terminated'
      });
      
      return {
        action: 'restrict',
        message: `Multiple sessions detected. ${sessionsTerminated} older sessions have been terminated. Maximum ${this.MAX_ALLOWED_SESSIONS} sessions allowed.`,
        blocked: false,
        sessionsTerminated
      };
    } else if (detectionResult.confidence >= 0.4) {
      // Low-medium confidence - warn user but allow access
      await storage.logSuspiciousActivity(userId, 'sharing_warning_issued', {
        confidence: detectionResult.confidence,
        action: 'warning_only'
      });
      
      return {
        action: 'warn',
        message: 'Multiple login sessions detected. If this wasn\'t you, please secure your account.',
        blocked: false
      };
    }

    return { action: 'allow', message: 'Access allowed with monitoring' };
  }

  // Enhanced detection with immediate enforcement
  async detectAndEnforce(
    userId: string, 
    currentDeviceId: string, 
    ipAddress: string,
    userAgent: string,
    storage: any
  ): Promise<SharingDetectionResult> {
    try {
      // First update session activity
      await storage.updateSessionActivity(userId, currentDeviceId, ipAddress, userAgent);
      
      // Perform detection
      const detectionResult = await this.detectSharing(userId, currentDeviceId, storage);
      
      // If sharing detected, enforce policy immediately
      if (detectionResult.isSharing) {
        const enforcement = await this.enforcePolicy(userId, detectionResult, storage);
        detectionResult.enforcement = {
          action: enforcement.action as any,
          sessionsTerminated: enforcement.sessionsTerminated,
          blocked: enforcement.blocked
        };
      }
      
      return detectionResult;
    } catch (error) {
      console.error('Error in detectAndEnforce:', error);
      return {
        isSharing: false,
        reason: 'Error during enforcement',
        confidence: 0,
        activeSessions: 0,
        suspiciousDevices: []
      };
    }
  }

  // Quick check for blocking requests
  async shouldBlockRequest(userId: string, currentDeviceId: string, storage: any): Promise<boolean> {
    try {
      const detectionResult = await this.detectSharing(userId, currentDeviceId, storage);
      return detectionResult.confidence >= 0.8;
    } catch (error) {
      console.error('Error in shouldBlockRequest:', error);
      return false; // Fail open for availability
    }
  }
}

export const sharingDetectionService = new SharingDetectionService();