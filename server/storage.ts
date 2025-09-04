import {
  users,
  tradingSignals,
  type User,
  type UpsertUser,
  type TradingSignal,
  type InsertTradingSignal,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Credit operations
  updateUserCredits(userId: string, dailyCredits: number, monthlyCredits: number): Promise<void>;
  resetDailyCredits(userId: string): Promise<void>;
  
  // Signal operations
  createSignal(signal: InsertTradingSignal): Promise<TradingSignal>;
  getUserSignals(userId: string, limit?: number): Promise<TradingSignal[]>;
  getRecentSignals(userId: string, hours?: number): Promise<TradingSignal[]>;
  updateSignalStatus(signalId: string, status: 'active' | 'closed' | 'stopped', pips?: number): Promise<void>;
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
        dailyCredits: 0,
        lastCreditReset: new Date(),
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

  async updateSignalStatus(signalId: string, status: 'active' | 'closed' | 'stopped', pips?: number): Promise<void> {
    const updateData: any = { 
      status,
      updatedAt: new Date() 
    };
    
    if (status !== 'active') {
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
}

export const storage = new DatabaseStorage();
