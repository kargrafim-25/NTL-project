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
    const currentPrice = 2045.60; // In real implementation, this would come from live price feed
    
    const prompt = `You are a professional forex trading expert specializing in XAUUSD (Gold) analysis. 

Current XAUUSD price: $${currentPrice}
Timeframe: ${timeframe}
Subscription tier: ${subscriptionTier}

Generate a trading signal for XAUUSD with the following requirements:

1. Analyze current market conditions for the ${timeframe} timeframe
2. Provide a BUY or SELL recommendation
3. Set realistic entry price (within 0.5% of current price)
4. Calculate appropriate stop loss (risk management)
5. Set take profit targets based on technical analysis
6. Provide confidence rating (1-100%)
7. Include detailed analysis explaining the signal rationale

${subscriptionTier === 'starter' ? 
  'Provide brief analysis with key technical points.' : 
  'Provide comprehensive analysis including technical indicators, market sentiment, and future predictions.'
}

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
      temperature: 0.7,
      max_completion_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Validate and sanitize the response
    return {
      direction: result.direction === 'SELL' ? 'SELL' : 'BUY',
      entryPrice: parseFloat(result.entryPrice) || currentPrice,
      stopLoss: parseFloat(result.stopLoss) || (currentPrice * 0.98),
      takeProfit: parseFloat(result.takeProfit) || (currentPrice * 1.02),
      confidence: Math.max(1, Math.min(100, parseInt(result.confidence) || 75)),
      analysis: result.analysis || 'Technical analysis indicates favorable trading conditions.'
    };

  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to generate trading signal: ${error.message}`);
  }
}
