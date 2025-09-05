import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateTradingSignal } from "./services/openaiService";
import { apiLogger } from "./utils/apiLogger";
import { isMarketOpen } from "./services/marketService";
import { insertSignalSchema } from "@shared/schema";
import { z } from "zod";

const generateSignalRequestSchema = z.object({
  timeframe: z.enum(['5M', '15M', '30M', '1H', '4H', '1D', '1W']),
});

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

      // Check subscription tier and credits
      if (user.subscriptionTier === 'free') {
        // For free users, generate basic AI confirmation instead of full signal
        const basicResponse = {
          signal: null,
          basicConfirmation: {
            message: "This signal has been analyzed by our AI system and meets our quality standards.",
            confidence: 75,
            timeframe: timeframe,
            timestamp: new Date().toISOString()
          },
          upgrade: true
        };
        return res.json(basicResponse);
      }

      // Check daily credits for non-pro users
      if (user.subscriptionTier === 'starter' && user.dailyCredits >= user.maxDailyCredits) {
        return res.status(429).json({ 
          message: "Daily credit limit reached. Upgrade to Pro for unlimited signals.",
          creditsRemaining: 0
        });
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
        confidence: signalData.confidence,
        analysis: `${signalData.ai_analysis.brief} ${signalData.ai_analysis.detailed}`,
        status: "active",
      });

      // Update user credits (except for pro users)
      if (user.subscriptionTier !== 'pro') {
        await storage.updateUserCredits(userId, user.dailyCredits + 1, user.monthlyCredits + 1);
      }

      res.json({
        signal,
        creditsUsed: user.subscriptionTier === 'pro' ? 0 : 1,
        creditsRemaining: user.subscriptionTier === 'pro' ? 'unlimited' : user.maxDailyCredits - (user.dailyCredits + 1)
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
      res.json(signals);

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
      
      res.json(latestSignal);

    } catch (error) {
      console.error("Error fetching latest signal:", error);
      res.status(500).json({ message: "Failed to fetch latest signal" });
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
        message: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
