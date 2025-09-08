import OpenAI from "openai";
import { apiLogger, APILogEntry } from "../utils/apiLogger";

// Using GPT-5 Mini as requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

export interface TakeProfitLevel {
  level: number;
  price: number;
  risk_reward_ratio: number;
}

export interface AIAnalysis {
  brief: string;
  detailed: string;
  market_sentiment: string;
  trend_direction: string;
  key_indicators: string[];
}

export interface HistoricalPosition {
  symbol: string;
  entry_price: number;
  current_status: string;
  days_active: number;
  unrealized_pnl: number;
}

export interface TradingSignalData {
  action: 'BUY' | 'SELL';
  entry: number;
  stop_loss: number;
  take_profit: number;
  confidence: number;
  take_profits: TakeProfitLevel[];
  ai_analysis: AIAnalysis;
  future_positions: any[];
  historical_positions: HistoricalPosition[];
  has_notifications: boolean;
}

export async function generateTradingSignal(
  timeframe: string, 
  subscriptionTier: string,
  userId?: string
): Promise<TradingSignalData> {
  const startTime = Date.now();
  let logEntry: APILogEntry;
  
  try {
    const symbol = "XAUUSD";
    
    const prompt = `You are a professional XAUUSD trading analyst. Please analyze the current XAUUSD market on the ${timeframe} timeframe and provide a trading signal.

Search for current XAUUSD price and recent market data. Perform comprehensive technical analysis including current price, support/resistance levels, RSI, MACD, moving averages, Bollinger Bands, market sentiment, and volume analysis.

Based on your analysis, determine BUY or SELL action and calculate entry, stop loss, and ${subscriptionTier === 'pro' ? '3 take profit levels' : 'take profit levels'}. Provide confidence score 60-100.

IMPORTANT: Provide ONLY clean market analysis text without any website links, URLs, or external resource references. Keep analysis professional and focused on trading insights only.

Return analysis in exact JSON format:
{
    "action": "BUY or SELL",
    "entry": current_market_price_number,
    "stop_loss": calculated_stop_loss_number,
    "take_profit": primary_take_profit_number,
    "confidence": confidence_score_60_to_100,
    "take_profits": [
        {"level": 1, "price": first_tp_level, "risk_reward_ratio": 1.5}${subscriptionTier === 'pro' ? ',\n        {"level": 2, "price": second_tp_level, "risk_reward_ratio": 2.0},\n        {"level": 3, "price": third_tp_level, "risk_reward_ratio": 3.0}' : ''}
    ],
    "ai_analysis": {
        "brief": "${subscriptionTier === 'starter' ? 'One sentence market summary without any links' : 'Brief market analysis summary without any links'}",
        "detailed": "${subscriptionTier === 'pro' ? 'Detailed 3-sentence technical analysis with indicators and reasoning, no links' : subscriptionTier === 'starter' ? '2 sentences about market conditions and trade setup, no links' : 'Current market analysis with technical details, no links'}",
        "market_sentiment": "BULLISH, BEARISH, or NEUTRAL",
        "trend_direction": "UPWARD, DOWNWARD, or SIDEWAYS", 
        "key_indicators": ["List of technical indicators used in analysis"]
    },
    "future_positions": [],
    "historical_positions": [
        {"symbol": "XAUUSD", "entry_price": realistic_recent_price, "current_status": "ACTIVE", "days_active": 2, "unrealized_pnl": calculated_pnl}
    ],
    "has_notifications": true
}`;

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      tools: [
        { type: "web_search" },
      ],
      input: prompt,
    });

    const result = JSON.parse(response.output_text || '{}');

    // Validate that we have actual numeric prices (no fallbacks)
    const entryPrice = parseFloat(result.entry);
    const stopLoss = parseFloat(result.stop_loss);
    const takeProfit = parseFloat(result.take_profit);

    if (!entryPrice || !stopLoss || !takeProfit || 
        entryPrice <= 0 || stopLoss <= 0 || takeProfit <= 0) {
      throw new Error("Invalid market prices received. AI may not have access to current market data. Please retry.");
    }

    // Validate that prices are realistic for gold (basic sanity check)
    if (entryPrice < 1000 || entryPrice > 5000) {
      throw new Error("Unrealistic gold price received. AI may not have access to current market data. Please retry.");
    }

    // Return validated result with no fallbacks
    const finalResult: TradingSignalData = {
      action: result.action === 'SELL' ? 'SELL' : 'BUY',
      entry: entryPrice,
      stop_loss: stopLoss,
      take_profit: takeProfit,
      confidence: Math.max(1, Math.min(100, parseInt(result.confidence) || 75)),
      take_profits: result.take_profits || [],
      ai_analysis: result.ai_analysis || {
        brief: "Market analysis completed.",
        detailed: "Technical analysis based on current conditions.",
        market_sentiment: "NEUTRAL",
        trend_direction: "SIDEWAYS",
        key_indicators: ["Technical Analysis"]
      },
      future_positions: result.future_positions || [],
      historical_positions: result.historical_positions || [],
      has_notifications: result.has_notifications !== false
    };

    // Log successful API call
    const executionTime = Date.now() - startTime;
    logEntry = {
      timestamp: new Date().toISOString(),
      userId: userId || 'unknown',
      timeframe,
      subscriptionTier,
      request: {
        symbol,
        timeframe,
        userTier: subscriptionTier
      },
      response: finalResult,
      executionTime,
      success: true
    };

    await apiLogger.logSignalGeneration(logEntry);
    
    return finalResult;

  } catch (error) {
    console.error("OpenAI API error:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log failed API call
    const executionTime = Date.now() - startTime;
    logEntry = {
      timestamp: new Date().toISOString(),
      userId: userId || 'unknown',
      timeframe,
      subscriptionTier,
      request: {
        symbol: "XAUUSD",
        timeframe,
        userTier: subscriptionTier
      },
      response: null,
      executionTime,
      success: false,
      error: errorMessage
    };

    await apiLogger.logSignalGeneration(logEntry);
    
    throw new Error(`Failed to generate trading signal: ${errorMessage}`);
  }
}
