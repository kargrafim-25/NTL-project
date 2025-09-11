import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateTradingSignal } from "./services/openaiService";
import { apiLogger } from "./utils/apiLogger";
import { isMarketOpen } from "./services/marketService";
import { insertSignalSchema, insertNewsSchema } from "@shared/schema";
import { getSignalStatus } from "./signalLifecycle";
import { notificationService } from "./services/notificationService";
import { forexFactoryService } from "./services/forexFactoryService";
import { z } from "zod";

const generateSignalRequestSchema = z.object({
  timeframe: z.enum(['5M', '15M', '30M', '1H', '4H', '1D', '1W']),
});

// Helper function to apply lifecycle status to signals
function applyLifecycleStatus(signals: any[]) {
  return signals.map(signal => {
    const currentStatus = getSignalStatus(signal.createdAt, signal.timeframe);
    return {
      ...signal,
      status: currentStatus
    };
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Market status endpoint
  app.get('/api/v1/market-status', async (req, res) => {
    try {
      const marketOpen = isMarketOpen();
      res.json({ 
        isOpen: marketOpen,
        timezone: 'Africa/Casablanca',
        message: marketOpen ? 'Market is currently open' : 'Market is currently closed'
      });
    } catch (error) {
      console.error("Error checking market status:", error);
      res.status(500).json({ message: "Failed to check market status" });
    }
  });

  // Health check endpoint
  app.get('/api/v1/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Generate trading signal
  app.post('/api/v1/generate-signal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate request body
      const { timeframe } = generateSignalRequestSchema.parse(req.body);

      // Check market hours
      if (!isMarketOpen()) {
        return res.status(400).json({ 
          message: "Market is currently closed. Trading signals are only available during market hours.",
          marketStatus: "closed"
        });
      }

      // Define daily limits and cooldowns based on subscription tier
      const tierLimits = {
        free: { dailyLimit: 2, cooldownMinutes: 90 },
        starter: { dailyLimit: 8, cooldownMinutes: 30 },
        pro: { dailyLimit: 20, cooldownMinutes: 15 }
      };
      
      const userTierLimits = tierLimits[user.subscriptionTier as keyof typeof tierLimits] || tierLimits.free;

      // Atomic check and update - prevent race conditions
      const currentTime = new Date();
      const cooldownEndTime = user.lastGenerationTime 
        ? new Date(new Date(user.lastGenerationTime).getTime() + (userTierLimits.cooldownMinutes * 60 * 1000))
        : null;
        
      // Check if user can generate (daily limit and cooldown)
      const canGenerate = user.dailyCredits < userTierLimits.dailyLimit && 
                         (!cooldownEndTime || currentTime >= cooldownEndTime);
      
      if (!canGenerate) {
        // Return appropriate error message
        if (user.dailyCredits >= userTierLimits.dailyLimit) {
          const upgradeMessages = {
            free: "Daily limit reached. Free users get 2 signals per day. Upgrade to Starter for 8 signals per day.",
            starter: "Daily limit reached. Starter users get 8 signals per day. Upgrade to Pro for 20 signals per day.",
            pro: "Daily limit reached. Pro users get 20 signals per day."
          };
          
          return res.status(429).json({ 
            message: upgradeMessages[user.subscriptionTier as keyof typeof upgradeMessages] || upgradeMessages.free,
            creditsRemaining: 0,
            dailyLimitReached: true
          });
        }
        
        if (cooldownEndTime && currentTime < cooldownEndTime) {
          const remainingTime = Math.ceil((cooldownEndTime.getTime() - currentTime.getTime()) / (1000 * 60));
          return res.status(429).json({
            message: `Please wait ${remainingTime} minute${remainingTime !== 1 ? 's' : ''} before generating another signal.`,
            cooldownRemaining: remainingTime,
            nextGenerationTime: cooldownEndTime.toISOString()
          });
        }
      }
      
      // Try atomic update - only proceed if user still can generate
      const updateResult = await storage.atomicGenerationUpdate(
        userId, 
        user.dailyCredits, 
        userTierLimits.dailyLimit,
        user.lastGenerationTime,
        userTierLimits.cooldownMinutes,
        currentTime
      );
      
      if (!updateResult.success) {
        // Another request beat us to it, recalculate and return error
        const updatedUser = await storage.getUser(userId);
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        if (updatedUser.dailyCredits >= userTierLimits.dailyLimit) {
          return res.status(429).json({ 
            message: "Daily limit reached. Another request was processed first.",
            creditsRemaining: 0,
            dailyLimitReached: true
          });
        }
        
        const newCooldownEndTime = updatedUser.lastGenerationTime 
          ? new Date(new Date(updatedUser.lastGenerationTime).getTime() + (userTierLimits.cooldownMinutes * 60 * 1000))
          : null;
          
        if (newCooldownEndTime && currentTime < newCooldownEndTime) {
          const remainingTime = Math.ceil((newCooldownEndTime.getTime() - currentTime.getTime()) / (1000 * 60));
          return res.status(429).json({
            message: `Cooldown active. Another request was processed first.`,
            cooldownRemaining: remainingTime,
            nextGenerationTime: newCooldownEndTime.toISOString()
          });
        }
        
        return res.status(500).json({ message: "Failed to process request. Please try again." });
      }

      // Reset daily credits if needed (new day)
      const lastReset = new Date(user.lastCreditReset || 0);
      const now = new Date();
      const casablancaTime = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Casablanca"}));
      
      if (casablancaTime.getDate() !== lastReset.getDate() || 
          casablancaTime.getMonth() !== lastReset.getMonth() ||
          casablancaTime.getFullYear() !== lastReset.getFullYear()) {
        await storage.resetDailyCredits(userId);
        user.dailyCredits = 0;
      }

      // Generate signal using OpenAI
      const signalData = await generateTradingSignal(timeframe, user.subscriptionTier, userId);

      // Create signal record
      const signal = await storage.createSignal({
        userId,
        pair: "XAUUSD",
        direction: signalData.action,
        timeframe,
        entryPrice: signalData.entry.toString(),
        stopLoss: signalData.stop_loss.toString(),
        takeProfit: signalData.take_profit.toString(),
        takeProfits: signalData.take_profits || [], // Store takeProfits in database
        confidence: signalData.confidence,
        analysis: `${signalData.ai_analysis.brief} ${signalData.ai_analysis.detailed}`
          .replace(/\[.*?\]/g, '') // Remove [text]
          .replace(/\(.*?\.com.*?\)/g, '') // Remove (website.com links)
          .replace(/\([^)]*https?[^)]*\)/g, '') // Remove any (links with http)
          .replace(/\([^)]*www\.[^)]*\)/g, '') // Remove any (www.links)
          .trim(),
        status: "fresh",
      });

      // Credits and generation time already updated atomically above

      res.json({
        signal,
        creditsUsed: user.subscriptionTier === 'pro' ? 0 : 1,
        creditsRemaining: userTierLimits.dailyLimit - (user.dailyCredits + 1),
        cooldownMinutes: userTierLimits.cooldownMinutes,
        nextGenerationTime: new Date(Date.now() + (userTierLimits.cooldownMinutes * 60 * 1000)).toISOString()
      });

    } catch (error) {
      console.error("Error generating signal:", error);
      res.status(500).json({ message: "Failed to generate trading signal" });
    }
  });

  // Get user signals
  app.get('/api/v1/signals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Free tier users can't access signal history
      if (user.subscriptionTier === 'free') {
        return res.status(403).json({ 
          message: "Signal history is available for Starter and Pro members only.",
          upgrade: true
        });
      }

      const signals = await storage.getUserSignals(userId, 50);
      const signalsWithLifecycle = applyLifecycleStatus(signals);
      res.json(signalsWithLifecycle);

    } catch (error) {
      console.error("Error fetching signals:", error);
      res.status(500).json({ message: "Failed to fetch signals" });
    }
  });

  // Get latest signal
  app.get('/api/v1/signals/latest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Free tier users can't access latest signals
      if (user.subscriptionTier === 'free') {
        return res.status(403).json({ 
          message: "Latest signals are available for Starter and Pro members only.",
          upgrade: true
        });
      }

      const signals = await storage.getUserSignals(userId, 1);
      const latestSignal = signals[0] || null;
      
      if (latestSignal) {
        const signalWithLifecycle = applyLifecycleStatus([latestSignal])[0];
        res.json(signalWithLifecycle);
      } else {
        res.json(null);
      }

    } catch (error) {
      console.error("Error fetching latest signal:", error);
      res.status(500).json({ message: "Failed to fetch latest signal" });
    }
  });

  // Notification routes
  
  // Get pending signal reviews for user notification
  app.get('/api/v1/notifications/pending-reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pendingData = await notificationService.checkPendingSignalReviews(userId);
      res.json(pendingData);
    } catch (error) {
      console.error("Error fetching pending reviews:", error);
      res.status(500).json({ message: "Failed to fetch pending reviews" });
    }
  });

  // Update signal user action
  app.patch('/api/v1/signals/:signalId/action', isAuthenticated, async (req: any, res) => {
    try {
      const { signalId } = req.params;
      const { action } = req.body;
      
      if (!['successful', 'unsuccessful', 'didnt_take'].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'successful', 'unsuccessful', or 'didnt_take'" });
      }

      await storage.updateSignalUserAction(signalId, action);
      
      // Mark notification as sent for this user
      const userId = req.user.claims.sub;
      await notificationService.markNotificationSent(userId);
      
      res.json({ message: "Signal action updated successfully" });
    } catch (error) {
      console.error("Error updating signal action:", error);
      res.status(500).json({ message: "Failed to update signal action" });
    }
  });

  // Get notification count for badge
  app.get('/api/v1/notifications/count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationData = await notificationService.getNotificationCount(userId);
      res.json(notificationData);
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  // Get monthly completion status
  app.get('/api/v1/notifications/monthly-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const monthlyData = await notificationService.checkMonthlyCompletion(userId);
      res.json(monthlyData);
    } catch (error) {
      console.error("Error fetching monthly status:", error);
      res.status(500).json({ message: "Failed to fetch monthly status" });
    }
  });

  // Claim discount code
  app.post('/api/v1/notifications/claim-discount', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.pendingDiscountCode) {
        return res.status(404).json({ message: "No discount code available" });
      }

      // Clear the discount code (user has claimed it)
      await storage.updateUserDiscountCode(userId, '');
      
      res.json({ 
        message: "Discount code claimed successfully",
        discountCode: user.pendingDiscountCode
      });
    } catch (error) {
      console.error("Error claiming discount:", error);
      res.status(500).json({ message: "Failed to claim discount code" });
    }
  });

  // View API logs (authenticated users only)
  app.get('/api/v1/logs', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(403).json({ message: "Authentication required" });
      }

      const { date } = req.query;
      
      if (date) {
        // Get logs for specific date
        const logs = await apiLogger.getLogsByDate(date);
        res.json({ date, logs });
      } else {
        // Get all log files
        const logFiles = await apiLogger.getAllLogFiles();
        res.json({ logFiles });
      }

    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // Debug GPT-5 connectivity
  app.get('/api/v1/debug-gpt5', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.claims?.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Test basic OpenAI connectivity
      const testSignal = await generateTradingSignal('1H', 'pro', user.claims.sub);
      
      res.json({
        status: 'connected',
        model: 'gpt-5-mini',
        timestamp: new Date().toISOString(),
        testSignal
      });

    } catch (error) {
      console.error("GPT-5 debug error:", error);
      res.status(500).json({ 
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // News endpoints - Now powered by ForexFactory live data
  app.get('/api/v1/news/recent', async (req, res) => {
    try {
      const { limit = '10' } = req.query;
      
      const news = await forexFactoryService.getRecentNews(
        parseInt(limit as string)
      );
      
      // Add logging for debugging
      console.log(`[ForexFactory] Fetched ${news.length} recent news items`);
      
      res.json(news);
    } catch (error) {
      console.error("Error fetching recent news from ForexFactory:", error);
      res.status(500).json({ message: "Failed to fetch recent news" });
    }
  });

  app.get('/api/v1/news/upcoming', async (req, res) => {
    try {
      const { limit = '10' } = req.query;
      
      const news = await forexFactoryService.getUpcomingNews(
        parseInt(limit as string)
      );
      
      // Add logging for debugging
      console.log(`[ForexFactory] Fetched ${news.length} upcoming news items`);
      
      res.json(news);
    } catch (error) {
      console.error("Error fetching upcoming news from ForexFactory:", error);
      res.status(500).json({ message: "Failed to fetch upcoming news" });
    }
  });

  // ForexFactory cache management endpoint (admin only)
  app.post('/api/v1/news/refresh-cache', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.claims?.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Clear ForexFactory cache to force refresh
      forexFactoryService.clearCache();
      
      res.json({ 
        message: "ForexFactory cache cleared successfully",
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Error clearing ForexFactory cache:", error);
      res.status(500).json({ message: "Failed to clear cache" });
    }
  });

  app.post('/api/v1/news', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.subscriptionTier === 'free') {
        return res.status(403).json({ 
          message: "News management requires a paid subscription" 
        });
      }

      // Validate request body
      const newsData = insertNewsSchema.parse(req.body);
      
      const news = await storage.createNews(newsData);
      res.status(201).json(news);
      
    } catch (error) {
      console.error("Error creating news:", error);
      res.status(500).json({ message: "Failed to create news item" });
    }
  });

  // Contact form submission endpoint
  app.post('/api/v1/contact', async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ 
          message: "Name, email, and message are required" 
        });
      }

      // Here you would typically send an email to your support team
      // For now, we'll just log it and return success
      console.log("Contact form submission:", {
        name,
        email,
        subject: subject || "No subject",
        message,
        timestamp: new Date().toISOString()
      });

      // TODO: Integrate with email service (e.g., SendGrid, Nodemailer)
      // await sendEmailToSupport({ name, email, subject, message });

      res.status(200).json({ 
        message: "Contact form submitted successfully",
        success: true 
      });
      
    } catch (error) {
      console.error("Error submitting contact form:", error);
      res.status(500).json({ message: "Failed to submit contact form" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
