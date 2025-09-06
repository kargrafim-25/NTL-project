import { storage } from '../storage';
import { differenceInHours, differenceInDays, isToday, startOfMonth, endOfMonth, addMonths, differenceInCalendarDays } from 'date-fns';

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

  // Check if user completed all signal reviews for the current billing cycle
  async checkMonthlyCompletion(userId: string): Promise<{
    completed: boolean;
    allSignalsReviewed: boolean;
    totalSignals: number;
    reviewedSignals: number;
    discountCode?: string;
    discountPercentage: number;
    billingCycleEnd?: Date;
    daysUntilBillingCycleEnd: number;
  }> {
    const user = await storage.getUser(userId);
    if (!user) return { 
      completed: false, 
      allSignalsReviewed: false, 
      totalSignals: 0, 
      reviewedSignals: 0, 
      discountPercentage: 0, 
      daysUntilBillingCycleEnd: 999 
    };

    const now = new Date();
    
    // Calculate billing cycle period based on subscription start date
    const subscriptionStart = user.subscriptionStartDate || user.createdAt || now;
    
    // Find current billing cycle (subscription date to same date next month)
    let billingCycleStart = new Date(subscriptionStart);
    let billingCycleEnd = addMonths(billingCycleStart, 1);
    
    // Adjust to current billing cycle if we're past the first month
    while (billingCycleEnd < now) {
      billingCycleStart = new Date(billingCycleEnd);
      billingCycleEnd = addMonths(billingCycleStart, 1);
    }

    // Get all signals closed in current billing cycle
    const signals = await storage.getUserSignals(userId);
    const billingCycleSignals = signals.filter(signal => 
      signal.status === 'closed' &&
      signal.closedAt &&
      signal.closedAt >= billingCycleStart &&
      signal.closedAt < billingCycleEnd
    );

    const totalSignals = billingCycleSignals.length;
    const reviewedSignals = billingCycleSignals.filter(signal => 
      signal.userAction !== 'pending'
    ).length;

    const allSignalsReviewed = totalSignals > 0 && reviewedSignals === totalSignals;
    
    // Check if we're within 1 day of billing cycle end
    const daysUntilBillingCycleEnd = differenceInCalendarDays(billingCycleEnd, now);
    const isWithinLastDay = daysUntilBillingCycleEnd <= 1 && daysUntilBillingCycleEnd >= 0;
    
    // Discount is only available when both conditions are met:
    // 1. All signals are reviewed
    // 2. We're within the last day of the billing cycle
    const completed = allSignalsReviewed && isWithinLastDay;

    // Calculate discount percentage - 6% for all tiers when completed
    let discountPercentage = 0;
    if (completed) {
      discountPercentage = 6; // 6% discount for all subscription tiers
    }

    // Generate discount code if completed and not already generated
    let discountCode;
    if (completed && !user.pendingDiscountCode) {
      discountCode = this.generateDiscountCode(userId, billingCycleStart.getMonth() + 1, billingCycleStart.getFullYear());
      await storage.updateUserDiscountCode(userId, discountCode);
    } else if (user.pendingDiscountCode) {
      discountCode = user.pendingDiscountCode;
    }

    return {
      completed,
      allSignalsReviewed,
      totalSignals,
      reviewedSignals,
      discountCode,
      discountPercentage,
      billingCycleEnd,
      daysUntilBillingCycleEnd
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