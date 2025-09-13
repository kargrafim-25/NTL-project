import {
  users,
  tradingSignals,
  economicNews,
  userSessions,
  securityEvents,
  type User,
  type UpsertUser,
  type TradingSignal,
  type InsertTradingSignal,
  type EconomicNews,
  type InsertEconomicNews,
  type UserSession,
  type InsertUserSession,
  type SecurityEvent,
  type InsertSecurityEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, or, sql, ne, count, max } from "drizzle-orm";
import { verificationService } from "./services/verificationService";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Credit operations
  updateUserCredits(userId: string, dailyCredits: number, monthlyCredits: number): Promise<void>;
  resetDailyCredits(userId: string): Promise<void>;
  updateUserLastGenerationTime(userId: string, timestamp: Date): Promise<void>;
  atomicGenerationUpdate(userId: string, dailyLimit: number, cooldownMinutes: number, now: Date): Promise<{success: boolean}>;
  revertGenerationUpdate(userId: string, previousDailyCredits: number, previousLastGenerationTime: Date | null): Promise<void>;
  
  // Signal operations
  createSignal(signal: InsertTradingSignal): Promise<TradingSignal>;
  getUserSignals(userId: string, limit?: number): Promise<TradingSignal[]>;
  getRecentSignals(userId: string, hours?: number): Promise<TradingSignal[]>;
  updateSignalStatus(signalId: string, status: 'fresh' | 'active' | 'closed' | 'stopped', pips?: number): Promise<void>;
  updateSignalUserAction(signalId: string, userAction: 'successful' | 'unsuccessful' | 'didnt_take'): Promise<void>;
  updateUserNotificationDate(userId: string): Promise<void>;
  updateUserDiscountCode(userId: string, discountCode: string): Promise<void>;
  getLatestSignal(userId: string): Promise<TradingSignal | undefined>;
  getAllActiveSignals(): Promise<TradingSignal[]>;
  
  // News operations
  createNews(news: InsertEconomicNews): Promise<EconomicNews>;
  getRecentNews(limit?: number, currency?: string, impact?: string): Promise<EconomicNews[]>;
  getUpcomingNews(limit?: number, currency?: string, impact?: string): Promise<EconomicNews[]>;
  archiveOldNews(daysOld: number): Promise<void>;
  
  // Verification operations
  setEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  setPhoneVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  verifyEmailToken(userId: string, token: string): Promise<{success: boolean, expired?: boolean}>;
  verifyPhoneToken(userId: string, token: string): Promise<{success: boolean, expired?: boolean}>;
  markEmailVerified(userId: string): Promise<void>;
  markPhoneVerified(userId: string): Promise<void>;
  
  // Abuse detection operations
  logUserSession(userId: string, ipAddress: string, userAgent: string, deviceFingerprint?: any): Promise<void>;
  checkSuspiciousActivity(userId: string, ipAddress: string): Promise<{suspicious: boolean, reason?: string}>;
  getUserSessions(userId: string, sinceDate?: Date): Promise<any[]>;
  logSuspiciousActivity(userId: string, activityType: string, metadata?: any): Promise<void>;
  getActiveSessionsForUser(userId: string): Promise<number>;
  getActiveSessionsForIP(ipAddress: string): Promise<number>;
  
  // Session management operations
  terminateUserSession(sessionId: string): Promise<void>;
  terminateOldestUserSessions(userId: string, maxSessions: number): Promise<void>;
  updateSessionActivity(userId: string, deviceId: string, ipAddress: string, userAgent: string, deviceFingerprint?: any): Promise<void>;
  terminateAllUserSessions(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserCredits(userId: string, dailyCredits: number, monthlyCredits: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        dailyCredits, 
        monthlyCredits,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async resetDailyCredits(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        dailyCredits: 0, // Reset to 0 (meaning "used 0 credits today")
        lastGenerationTime: null, // Clear cooldown - fresh start for the day
        lastCreditReset: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async updateUserLastGenerationTime(userId: string, timestamp: Date): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastGenerationTime: timestamp,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async atomicGenerationUpdate(
    userId: string, 
    dailyLimit: number, 
    cooldownMinutes: number, 
    now: Date
  ): Promise<{success: boolean}> {
    // Compute cutoff time to avoid parameter binding issues in SQL strings
    const cutoff = new Date(now.getTime() - cooldownMinutes * 60 * 1000);
    
    // Atomic conditional update - only update if conditions are still met
    // Always check DB state, don't rely on caller's view of lastGenerationTime
    const result = await db
      .update(users)
      .set({ 
        dailyCredits: sql`${users.dailyCredits} + 1`,
        monthlyCredits: sql`${users.monthlyCredits} + 1`,
        lastGenerationTime: now,
        updatedAt: now
      })
      .where(
        and(
          eq(users.id, userId),
          // Only update if daily credits haven't reached limit (DB state)
          sql`${users.dailyCredits} < ${dailyLimit}`,
          // Only update if cooldown has expired or no previous generation (DB state)
          sql`(${users.lastGenerationTime} IS NULL OR ${users.lastGenerationTime} <= ${cutoff})`
        )
      );
    
    // Check if any rows were updated (success) or not (race condition occurred)
    const rowsAffected = (result as any).rowCount ?? (result as any).changes ?? 0;
    return { success: rowsAffected > 0 };
  }
  
  async revertGenerationUpdate(
    userId: string, 
    previousDailyCredits: number, 
    previousLastGenerationTime: Date | null
  ): Promise<void> {
    await db
      .update(users)
      .set({ 
        dailyCredits: previousDailyCredits,
        monthlyCredits: sql`${users.monthlyCredits} - 1`,
        lastGenerationTime: previousLastGenerationTime,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async createSignal(signal: InsertTradingSignal): Promise<TradingSignal> {
    const [newSignal] = await db
      .insert(tradingSignals)
      .values(signal)
      .returning();
    return newSignal;
  }

  async getUserSignals(userId: string, limit = 20): Promise<TradingSignal[]> {
    return await db
      .select()
      .from(tradingSignals)
      .where(eq(tradingSignals.userId, userId))
      .orderBy(desc(tradingSignals.createdAt))
      .limit(limit);
  }

  async getRecentSignals(userId: string, hours = 24): Promise<TradingSignal[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return await db
      .select()
      .from(tradingSignals)
      .where(
        and(
          eq(tradingSignals.userId, userId),
          gte(tradingSignals.createdAt, cutoffTime)
        )
      )
      .orderBy(desc(tradingSignals.createdAt));
  }

  async updateSignalStatus(signalId: string, status: 'fresh' | 'active' | 'closed' | 'stopped', pips?: number): Promise<void> {
    const updateData: any = { 
      status,
      updatedAt: new Date() 
    };
    
    if (status === 'closed' || status === 'stopped') {
      updateData.closedAt = new Date();
    }
    
    if (pips !== undefined) {
      updateData.pips = pips.toString();
    }

    await db
      .update(tradingSignals)
      .set(updateData)
      .where(eq(tradingSignals.id, signalId));
  }

  async getLatestSignal(userId: string): Promise<TradingSignal | undefined> {
    const [signal] = await db
      .select()
      .from(tradingSignals)
      .where(eq(tradingSignals.userId, userId))
      .orderBy(desc(tradingSignals.createdAt))
      .limit(1);
    return signal;
  }

  async getAllActiveSignals(): Promise<TradingSignal[]> {
    return await db
      .select()
      .from(tradingSignals)
      .where(
        or(
          eq(tradingSignals.status, 'fresh'),
          eq(tradingSignals.status, 'active')
        )
      )
      .orderBy(desc(tradingSignals.createdAt));
  }

  async updateSignalUserAction(signalId: string, userAction: 'successful' | 'unsuccessful' | 'didnt_take'): Promise<void> {
    await db
      .update(tradingSignals)
      .set({ 
        userAction
      })
      .where(eq(tradingSignals.id, signalId));
  }

  async updateUserNotificationDate(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastNotificationDate: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async updateUserDiscountCode(userId: string, discountCode: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        pendingDiscountCode: discountCode,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  // News operations
  async createNews(news: InsertEconomicNews): Promise<EconomicNews> {
    const [newsItem] = await db
      .insert(economicNews)
      .values(news)
      .returning();
    return newsItem;
  }

  async getRecentNews(limit: number = 10, currency?: string, impact?: string): Promise<EconomicNews[]> {
    let query = db
      .select()
      .from(economicNews)
      .where(
        and(
          eq(economicNews.isArchived, false),
          gte(economicNews.eventTime, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
        )
      )
      .orderBy(desc(economicNews.eventTime))
      .limit(limit);

    return query;
  }

  async getUpcomingNews(limit: number = 10, currency?: string, impact?: string): Promise<EconomicNews[]> {
    let query = db
      .select()
      .from(economicNews)
      .where(
        and(
          eq(economicNews.isArchived, false),
          gte(economicNews.eventTime, new Date()) // Future events only
        )
      )
      .orderBy(economicNews.eventTime) // Ascending for upcoming events
      .limit(limit);

    return query;
  }

  async archiveOldNews(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    await db
      .update(economicNews)
      .set({ 
        isArchived: true,
        updatedAt: new Date() 
      })
      .where(
        and(
          eq(economicNews.isArchived, false),
          gte(economicNews.eventTime, cutoffDate)
        )
      );
  }

  // Verification operations
  async setEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    // Hash the token before storing for secure verification
    const hashedToken = verificationService.hashToken(token);
    await db
      .update(users)
      .set({ 
        emailVerificationToken: hashedToken,
        verificationTokenExpiry: expiresAt,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async setPhoneVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    // Hash the token before storing for secure verification
    const hashedToken = verificationService.hashToken(token);
    await db
      .update(users)
      .set({ 
        phoneVerificationToken: hashedToken,
        verificationTokenExpiry: expiresAt,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async verifyEmailToken(userId: string, token: string): Promise<{success: boolean, expired?: boolean}> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.emailVerificationToken) {
      return { success: false };
    }

    // Check if token is expired first
    if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
      return { success: false, expired: true };
    }

    // Use verification service to verify hashed token
    const isValidToken = verificationService.verifyToken(token, user.emailVerificationToken);
    if (!isValidToken) {
      return { success: false };
    }

    // Invalidate the token immediately after successful verification (single-use)
    await db
      .update(users)
      .set({ 
        emailVerificationToken: null,
        verificationTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return { success: true };
  }

  async verifyPhoneToken(userId: string, token: string): Promise<{success: boolean, expired?: boolean}> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.phoneVerificationToken) {
      return { success: false };
    }

    // Check if token is expired first
    if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
      return { success: false, expired: true };
    }

    // Use verification service to verify hashed token
    const isValidToken = verificationService.verifyToken(token, user.phoneVerificationToken);
    if (!isValidToken) {
      return { success: false };
    }

    // Invalidate the token immediately after successful verification (single-use)
    await db
      .update(users)
      .set({ 
        phoneVerificationToken: null,
        verificationTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return { success: true };
  }

  async markEmailVerified(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        emailVerified: true,
        emailVerificationToken: null,
        verificationTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async markPhoneVerified(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        phoneVerified: true,
        phoneVerificationToken: null,
        verificationTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Abuse detection operations
  async logUserSession(userId: string, ipAddress: string, userAgent: string, deviceFingerprint?: string): Promise<void> {
    // Clean up old sessions for this user (keep only last 5 active sessions)
    const activeSessions = await db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.userId, userId), eq(userSessions.isActive, true)))
      .orderBy(desc(userSessions.lastActivity))
      .limit(10);

    if (activeSessions.length >= 5) {
      // Deactivate oldest sessions
      const sessionsToDeactivate = activeSessions.slice(4);
      for (const session of sessionsToDeactivate) {
        await db
          .update(userSessions)
          .set({ isActive: false })
          .where(eq(userSessions.id, session.id));
      }
    }

    // Create new session
    await db
      .insert(userSessions)
      .values({
        userId,
        ipAddress,
        userAgent,
        deviceFingerprint,
        isActive: true,
        lastActivity: new Date()
      });
  }

  async getUserSessions(userId: string, sinceDate?: Date): Promise<any[]> {
    const cutoffDate = sinceDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours
    
    const sessions = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          gte(userSessions.lastActivity, cutoffDate)
        )
      )
      .orderBy(desc(userSessions.lastActivity));

    // Transform to match the interface expected by sharing detection service
    return sessions.map(session => {
      let parsedFingerprint = null;
      if (session.deviceFingerprint) {
        try {
          parsedFingerprint = JSON.parse(session.deviceFingerprint);
        } catch (e) {
          // If parsing fails, treat as string-based device ID
          parsedFingerprint = { deviceId: session.deviceFingerprint };
        }
      }

      return {
        userId: session.userId,
        deviceId: parsedFingerprint?.deviceId || session.deviceFingerprint || 'unknown',
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        lastActive: session.lastActivity,
        deviceFingerprint: parsedFingerprint
      };
    });
  }

  async checkSuspiciousActivity(userId: string, ipAddress: string): Promise<{suspicious: boolean, reason?: string}> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check for multiple IPs in short time
    const recentSessions = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          gte(userSessions.lastActivity, oneHourAgo)
        )
      );

    const uniqueIPs = new Set(recentSessions.map(s => s.ipAddress));
    if (uniqueIPs.size > 3) {
      await this.logSecurityEvent(userId, 'multiple_ips', ipAddress, 'Multiple IP addresses in 1 hour', 'medium');
      return { suspicious: true, reason: 'Multiple IP addresses detected' };
    }

    // Check for too many concurrent sessions
    const activeSessions = await this.getActiveSessionsForUser(userId);
    if (activeSessions > 5) {
      await this.logSecurityEvent(userId, 'multiple_sessions', ipAddress, 'Too many concurrent sessions', 'high');
      return { suspicious: true, reason: 'Too many concurrent sessions' };
    }

    // Check IP reputation (same IP used by multiple users recently)
    const ipUsers = await this.getActiveSessionsForIP(ipAddress);
    if (ipUsers > 10) {
      await this.logSecurityEvent(userId, 'shared_ip', ipAddress, 'IP used by many users', 'medium');
      return { suspicious: true, reason: 'Shared IP address detected' };
    }

    return { suspicious: false };
  }

  async getActiveSessionsForUser(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.isActive, true)
        )
      );

    return result[0]?.count || 0;
  }

  async getActiveSessionsForIP(ipAddress: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(userSessions)
      .where(
        and(
          eq(userSessions.ipAddress, ipAddress),
          eq(userSessions.isActive, true),
          gte(userSessions.lastActivity, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
        )
      );

    return result[0]?.count || 0;
  }

  async logSuspiciousActivity(userId: string, activityType: string, metadata?: any): Promise<void> {
    const details = metadata ? JSON.stringify(metadata) : 'No additional details';
    await this.logSecurityEvent(userId, activityType, 'system', details, 'medium');
  }

  // Session management operations
  async terminateUserSession(sessionId: string): Promise<void> {
    await db
      .update(userSessions)
      .set({ isActive: false })
      .where(eq(userSessions.id, sessionId));
  }

  async terminateOldestUserSessions(userId: string, maxSessions: number): Promise<void> {
    // Get all active sessions for the user, ordered by last activity (oldest first)
    const activeSessions = await db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.userId, userId), eq(userSessions.isActive, true)))
      .orderBy(userSessions.lastActivity); // Oldest first

    if (activeSessions.length > maxSessions) {
      // Terminate the oldest sessions to get down to maxSessions
      const sessionsToTerminate = activeSessions.slice(0, activeSessions.length - maxSessions);
      
      for (const session of sessionsToTerminate) {
        await this.terminateUserSession(session.id);
      }

      // Log the enforcement action
      await this.logSecurityEvent(
        userId, 
        'session_limit_enforced', 
        'system', 
        `Terminated ${sessionsToTerminate.length} oldest sessions (limit: ${maxSessions})`, 
        'medium'
      );
    }
  }

  async updateSessionActivity(userId: string, deviceId: string, ipAddress: string, userAgent: string, deviceFingerprint?: any): Promise<void> {
    // Try to find existing session with same device and IP
    const existingSessions = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.ipAddress, ipAddress),
          eq(userSessions.isActive, true)
        )
      )
      .orderBy(desc(userSessions.lastActivity))
      .limit(1);

    const deviceFingerprintStr = deviceFingerprint ? JSON.stringify(deviceFingerprint) : deviceId;

    if (existingSessions.length > 0) {
      // Update existing session
      await db
        .update(userSessions)
        .set({ 
          lastActivity: new Date(),
          userAgent,
          deviceFingerprint: deviceFingerprintStr
        })
        .where(eq(userSessions.id, existingSessions[0].id));
    } else {
      // Create new session
      await db
        .insert(userSessions)
        .values({
          userId,
          ipAddress,
          userAgent,
          deviceFingerprint: deviceFingerprintStr,
          isActive: true,
          lastActivity: new Date()
        });
    }

    // Enforce session limits after updating activity
    await this.terminateOldestUserSessions(userId, 2); // Allow max 2 sessions
  }

  async terminateAllUserSessions(userId: string): Promise<void> {
    await db
      .update(userSessions)
      .set({ isActive: false })
      .where(and(eq(userSessions.userId, userId), eq(userSessions.isActive, true)));

    // Log the enforcement action
    await this.logSecurityEvent(
      userId, 
      'all_sessions_terminated', 
      'system', 
      'All user sessions terminated due to security policy', 
      'high'
    );
  }

  // Helper method for logging security events
  private async logSecurityEvent(userId: string | null, eventType: string, ipAddress: string, details: string, severity: string): Promise<void> {
    await db
      .insert(securityEvents)
      .values({
        userId,
        eventType,
        ipAddress,
        details,
        severity
      });
  }
}

export const storage = new DatabaseStorage();
