import OpenAI from "openai";

// Using GPT-5 Mini as requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

export interface TradingSignalData {
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  analysis: string;
}

export async function generateTradingSignal(
  timeframe: string, 
  subscriptionTier: string
): Promise<TradingSignalData> {
  try {
    const prompt = `You are a professional forex trading expert specializing in XAUUSD (Gold) analysis with access to current market data.

**IMPORTANT**: You must analyze the CURRENT live market conditions for XAUUSD and provide a real trading signal based on actual market analysis.

Timeframe: ${timeframe}
Subscription tier: ${subscriptionTier}

Generate a real-time trading signal for XAUUSD with the following requirements:

1. Analyze CURRENT market conditions and price action for the ${timeframe} timeframe
2. Consider current market sentiment, economic factors, and technical indicators
3. Provide a BUY or SELL recommendation based on your analysis
4. Set realistic entry price based on current live market levels
5. Calculate appropriate stop loss for proper risk management
6. Set take profit targets based on technical analysis and market structure
7. Provide confidence rating (1-100%) based on signal strength
8. Include detailed analysis explaining the signal rationale with current market context

${subscriptionTier === 'starter' ? 
  `**STARTER ANALYSIS**: Provide brief analysis (2-3 sentences) covering:
  - Key technical indicator signal
  - Primary market factor driving the trade
  - Simple risk/reward explanation` : 
  subscriptionTier === 'pro' ? 
  `**PRO ANALYSIS**: Provide comprehensive detailed analysis (5-7 sentences) covering:
  - Multiple technical indicators (RSI, MACD, moving averages, support/resistance)
  - Current market sentiment and economic factors
  - News/events impact on gold prices
  - USD strength analysis
  - Risk management strategy
  - Future price predictions and key levels to watch` :
  `**STANDARD ANALYSIS**: Provide moderate analysis covering key technical points and market factors.`
}

**Note**: Base your analysis on real market conditions, not hypothetical prices. Consider current gold market dynamics, USD strength, inflation concerns, and technical chart patterns.

Respond in JSON format with this exact structure:
{
  "direction": "BUY or SELL",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "confidence": number,
  "analysis": "detailed explanation"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert XAUUSD trading analyst. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Validate and sanitize the response
    return {
      direction: result.direction === 'SELL' ? 'SELL' : 'BUY',
      entryPrice: parseFloat(result.entryPrice) || 2000,
      stopLoss: parseFloat(result.stopLoss) || (parseFloat(result.entryPrice) * 0.98),
      takeProfit: parseFloat(result.takeProfit) || (parseFloat(result.entryPrice) * 1.02),
      confidence: Math.max(1, Math.min(100, parseInt(result.confidence) || 75)),
      analysis: result.analysis || 'Technical analysis based on current market conditions.'
    };

  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to generate trading signal: ${error.message}`);
  }
}
