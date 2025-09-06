import { storage } from '../storage';
import { differenceInHours, differenceInDays, isToday, startOfMonth, endOfMonth } from 'date-fns';

export class NotificationService {
  
  // Check for signals that need user review (closed for >24 hours without user action)
  async checkPendingSignalReviews(userId: string): Promise<{
    pendingSignals: Array<{
      id: string;
      pair: string;
      direction: string;
      entryPrice: string;
      timeframe: string;
      closedAt: Date;
      daysSinceClose: number;
    }>;
    shouldNotify: boolean;
  }> {
    const user = await storage.getUser(userId);
    if (!user) return { pendingSignals: [], shouldNotify: false };

    // Get all closed signals with pending user action
    const signals = await storage.getUserSignals(userId);
    const pendingSignals = signals.filter(signal => 
      signal.status === 'closed' && 
      signal.userAction === 'pending' &&
      signal.closedAt
    );

    const pendingWithDetails = pendingSignals.map(signal => ({
      id: signal.id,
      pair: signal.pair,
      direction: signal.direction,
      entryPrice: signal.entryPrice,
      timeframe: signal.timeframe,
      closedAt: signal.closedAt!,
      daysSinceClose: differenceInDays(new Date(), signal.closedAt!)
    }));

    // Check if we should send a notification (daily, not already sent today)
    const shouldNotify = pendingSignals.length > 0 && 
      (!user.lastNotificationDate || !isToday(user.lastNotificationDate));

    return {
      pendingSignals: pendingWithDetails,
      shouldNotify
    };
  }

  // Generate discount code for monthly completion
  generateDiscountCode(userId: string, month: number, year: number): string {
    const prefix = "TRADER";
    const userIdShort = userId.slice(-4).toUpperCase();
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString().slice(-2);
    return `${prefix}${userIdShort}${monthStr}${yearStr}`;
  }

  // Check if user completed all signal reviews for the current month
  async checkMonthlyCompletion(userId: string): Promise<{
    completed: boolean;
    totalSignals: number;
    reviewedSignals: number;
    discountCode?: string;
    discountPercentage: number;
  }> {
    const user = await storage.getUser(userId);
    if (!user) return { completed: false, totalSignals: 0, reviewedSignals: 0, discountPercentage: 0 };

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Get all signals closed in current month
    const signals = await storage.getUserSignals(userId);
    const monthlySignals = signals.filter(signal => 
      signal.status === 'closed' &&
      signal.closedAt &&
      signal.closedAt >= monthStart &&
      signal.closedAt <= monthEnd
    );

    const totalSignals = monthlySignals.length;
    const reviewedSignals = monthlySignals.filter(signal => 
      signal.userAction !== 'pending'
    ).length;

    const completed = totalSignals > 0 && reviewedSignals === totalSignals;

    // Calculate discount percentage based on subscription tier
    let discountPercentage = 0;
    if (completed) {
      switch (user.subscriptionTier) {
        case 'free':
          discountPercentage = 10;
          break;
        case 'starter':
          discountPercentage = 15;
          break;
        case 'pro':
          discountPercentage = 20;
          break;
      }
    }

    // Generate discount code if completed and not already generated
    let discountCode;
    if (completed && !user.pendingDiscountCode) {
      discountCode = this.generateDiscountCode(userId, now.getMonth() + 1, now.getFullYear());
      await storage.updateUserDiscountCode(userId, discountCode);
    } else if (user.pendingDiscountCode) {
      discountCode = user.pendingDiscountCode;
    }

    return {
      completed,
      totalSignals,
      reviewedSignals,
      discountCode,
      discountPercentage
    };
  }

  // Mark notification as sent
  async markNotificationSent(userId: string): Promise<void> {
    await storage.updateUserNotificationDate(userId);
  }

  // Get notification badge count
  async getNotificationCount(userId: string): Promise<{
    pendingReviews: number;
    hasDiscount: boolean;
    discountCode?: string;
    discountPercentage: number;
  }> {
    const pendingData = await this.checkPendingSignalReviews(userId);
    const monthlyData = await this.checkMonthlyCompletion(userId);
    
    const user = await storage.getUser(userId);
    const hasDiscount = !!user?.pendingDiscountCode;

    return {
      pendingReviews: pendingData.pendingSignals.length,
      hasDiscount,
      discountCode: user?.pendingDiscountCode || undefined,
      discountPercentage: monthlyData.discountPercentage
    };
  }
}

export const notificationService = new NotificationService();