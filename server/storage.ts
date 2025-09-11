import {
  users,
  tradingSignals,
  economicNews,
  type User,
  type UpsertUser,
  type TradingSignal,
  type InsertTradingSignal,
  type EconomicNews,
  type InsertEconomicNews,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, or, sql } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
