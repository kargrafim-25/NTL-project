import OpenAI from "openai";

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
  subscriptionTier: string
): Promise<TradingSignalData> {
  try {
    const symbol = "XAUUSD";
    
    const prompt = `Generate a trading signal for ${symbol} in JSON format:
            
            {
                "action": "BUY",
                "entry": 2650.50,
                "stop_loss": 2630.00,
                "take_profit": 2680.00,
                "confidence": 85,
                "take_profits": [
                    {"level": 1, "price": 2665.00, "risk_reward_ratio": 1.5},
                    {"level": 2, "price": 2680.00, "risk_reward_ratio": 2.0},
                    {"level": 3, "price": 2690.00, "risk_reward_ratio": 3.0}
                ],
                "ai_analysis": {
                    "brief": "${subscriptionTier === 'starter' ? 'Give me a brief sentence about how you analyzed this signal' : 'Give me a brief sentence about how you analyzed this signal'}",
                    "detailed": "${subscriptionTier === 'pro' ? 'Give me a detailed 3 sentences about how you analyzed this signal and technicals you used' : subscriptionTier === 'starter' ? 'Give me 2 sentences about how you analyzed this signal' : 'Give me 2 sentences about technical analysis used'}",
                    "market_sentiment": "BULLISH",
                    "trend_direction": "UPWARD", 
                    "key_indicators": ["RSI", "Moving Averages", "Volume"]
                },
                "future_positions": [],
                "historical_positions": [
                    {"symbol": "${symbol}", "entry_price": 2640.00, "current_status": "ACTIVE", "days_active": 2, "unrealized_pnl": 85.00}
                ],
                "has_notifications": true
            }
            
            Provide a real analysis for ${symbol} with current market prices for ${timeframe} timeframe. Use real-time market data and current technical analysis.`;

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

    // Return the result with proper structure
    return {
      action: result.action === 'SELL' ? 'SELL' : 'BUY',
      entry: parseFloat(result.entry) || 2000,
      stop_loss: parseFloat(result.stop_loss) || 1980,
      take_profit: parseFloat(result.take_profit) || 2020,
      confidence: Math.max(1, Math.min(100, parseInt(result.confidence) || 75)),
      take_profits: result.take_profits || [],
      ai_analysis: result.ai_analysis || {
        brief: "Technical analysis indicates favorable trading conditions.",
        detailed: "Based on current market conditions and technical indicators.",
        market_sentiment: "NEUTRAL",
        trend_direction: "SIDEWAYS",
        key_indicators: ["RSI", "Moving Averages"]
      },
      future_positions: result.future_positions || [],
      historical_positions: result.historical_positions || [],
      has_notifications: result.has_notifications || true
    };

  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to generate trading signal: ${error.message}`);
  }
}
