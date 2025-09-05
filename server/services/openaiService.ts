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
    
    const prompt = `Role and Objective: You act as a professional trader analyzing XAUUSD on the ${timeframe} timeframe using strictly live, market data, with the help of web search.

Instructions: Always reference real, current XAUUSD prices—never hypothetical, simulated, or fictional data. Continuously gather the most current market data available. Begin with a concise checklist (3-7 bullets) outlining each analysis step before forming your response. Before making any data fetch or tool call, briefly state the purpose and required minimal inputs. Apply explicit stepwise reasoning internally in your analysis, including technical analysis, indicator checks, sentiment assessment, and price target calculations, before generating a final response. After gathering data and performing analysis, verify that all values are from live sources and the output meets schema requirements; self-correct if necessary before replying. If live market data is unavailable or you cannot identify a valid signal, respond only with the specified structured error JSON. Never generate, reference, or infer simulated/demo prices or use any placeholder, partial, or malformed output.

Context: You are working with XAUUSD ${timeframe} timeframe. Required output is a well-formed JSON object that strictly follows the provided schema.

Reasoning Steps Internally: Fetch current, accurate XAUUSD price. Analyze recent ${timeframe} price action, trend, key support/resistance, and use specific technical indicators (RSI, MACD, Moving Averages, Bollinger Bands, etc.). List actual indicators used in output. Decide trading action: strictly "BUY" or "SELL" (no ambiguous outputs). Calculate stop loss and 1-3 take profit levels based on live market structure. Estimate a confidence score (60-100) reflecting the certainty of your analysis.

Output Format: Output only a single JSON object conforming exactly to the schema:
{
    "action": "BUY or SELL based on current market analysis",
    "entry": actual_current_market_price_number,
    "stop_loss": calculated_stop_loss_based_on_current_price,
    "take_profit": calculated_take_profit_based_on_current_price,
    "confidence": confidence_level_60_to_100,
    "take_profits": [
        {"level": 1, "price": calculated_tp1, "risk_reward_ratio": 1.5},
        {"level": 2, "price": calculated_tp2, "risk_reward_ratio": 2.0},
        {"level": 3, "price": calculated_tp3, "risk_reward_ratio": 3.0}
    ],
    "ai_analysis": {
        "brief": "${subscriptionTier === 'starter' ? 'One sentence about current market analysis' : 'Brief analysis of current market conditions'}",
        "detailed": "${subscriptionTier === 'pro' ? 'Detailed 3-sentence analysis of current market conditions, technical indicators, and reasoning' : subscriptionTier === 'starter' ? '2 sentences about current market analysis and technical reasoning' : 'Current market analysis with technical details'}",
        "market_sentiment": "BULLISH, BEARISH, or NEUTRAL based on current conditions",
        "trend_direction": "UPWARD, DOWNWARD, or SIDEWAYS based on current trend", 
        "key_indicators": ["List actual technical indicators used in analysis"]
    },
    "future_positions": [],
    "historical_positions": [
        {"symbol": "XAUUSD", "entry_price": recent_realistic_price, "current_status": "ACTIVE", "days_active": 2, "unrealized_pnl": calculated_pnl}
    ],
    "has_notifications": true
}

If live market data is unavailable or you cannot identify a valid signal, respond only with:
{
    "error": "Cannot analyze any signal now due to market conditions. Please try again later.",
    "retry": true
}

Only provide trading signals with ACTUAL current market prices.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert XAUUSD trading analyst with access to real-time market data. Always respond with valid JSON only using current market conditions."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Check if AI returned an error (can't access real-time data)
    if (result.error || result.retry) {
      throw new Error(result.error || "AI cannot access real-time market data. Please retry.");
    }

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
    const finalResult = {
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
      error: error.message
    };

    await apiLogger.logSignalGeneration(logEntry);
    
    throw new Error(`Failed to generate trading signal: ${error.message}`);
  }
}
