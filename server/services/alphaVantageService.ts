import { format, addDays, subDays } from 'date-fns';
import axios from 'axios';

interface AlphaVantageNewsItem {
  title: string;
  url: string;
  time_published: string;
  summary: string;
  source: string;
  category_within_source: string;
  topics: Array<{
    topic: string;
    relevance_score: string;
  }>;
  overall_sentiment_score: number;
  overall_sentiment_label: string;
  ticker_sentiment: Array<{
    ticker: string;
    relevance_score: string;
    ticker_sentiment_score: string;
    ticker_sentiment_label: string;
  }>;
}

interface AlphaVantageNewsResponse {
  items: string;
  sentiment_score_definition: string;
  relevance_score_definition: string;
  feed: AlphaVantageNewsItem[];
}

interface ParsedNewsEvent {
  id: string;
  title: string;
  description: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF';
  impact: 'low' | 'medium' | 'high';
  eventTime: Date;
  actualValue?: string;
  forecastValue?: string;
  previousValue?: string;
  source: string;
  sourceUrl: string;
}

export class AlphaVantageService {
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';
  private cache: Map<string, { data: ParsedNewsEvent[], timestamp: number }> = new Map();
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes cache

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[AlphaVantage] API key not found, using fallback data');
    }
  }

  private async fetchNewsData(): Promise<AlphaVantageNewsItem[]> {
    if (!this.apiKey) {
      console.log('[AlphaVantage] No API key available, returning empty news');
      return [];
    }

    // Try multiple approaches in cascade
    const timeFrom = format(subDays(new Date(), 7), 'yyyyMMdd') + 'T0000';
    
    const approaches = [
      // 1. Valid topics with time window
      `function=NEWS_SENTIMENT&topics=financial_markets,economy_macro&time_from=${timeFrom}&sort=LATEST&limit=50&apikey=${this.apiKey}`,
      // 2. Just financial markets topic
      `function=NEWS_SENTIMENT&topics=financial_markets&time_from=${timeFrom}&sort=LATEST&limit=50&apikey=${this.apiKey}`,
      // 3. No topics, just time window
      `function=NEWS_SENTIMENT&time_from=${timeFrom}&sort=LATEST&limit=50&apikey=${this.apiKey}`,
      // 4. Broader time window (30 days)
      `function=NEWS_SENTIMENT&time_from=${format(subDays(new Date(), 30), 'yyyyMMdd')}T0000&sort=LATEST&limit=50&apikey=${this.apiKey}`,
      // 5. No filters at all
      `function=NEWS_SENTIMENT&sort=LATEST&limit=50&apikey=${this.apiKey}`
    ];

    for (let i = 0; i < approaches.length; i++) {
      try {
        const url = `${this.baseUrl}?${approaches[i]}`;
        console.log(`[AlphaVantage] Trying approach ${i + 1}/5: ${approaches[i].split('&')[0]}...`);
        
        const response = await axios.get<AlphaVantageNewsResponse>(url, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Next Trading Labs/1.0',
            'Accept': 'application/json'
          }
        });

        if (response.data && response.data.feed && Array.isArray(response.data.feed) && response.data.feed.length > 0) {
          console.log(`[AlphaVantage] Approach ${i + 1} successful: ${response.data.feed.length} news items`);
          return response.data.feed;
        } else if (response.data && response.data.items === "0") {
          console.log(`[AlphaVantage] Approach ${i + 1} returned items: "0", trying next approach`);
          continue;
        } else {
          console.log(`[AlphaVantage] Approach ${i + 1} invalid response format`);
          continue;
        }

      } catch (error: any) {
        const errorMsg = error.response?.status === 429 ? 'Rate limit exceeded' : 
                        error.response?.status ? `HTTP ${error.response.status}` : 
                        error.message;
        console.log(`[AlphaVantage] Approach ${i + 1} failed: ${errorMsg}`);
        if (error.response?.status === 429) {
          // Rate limit hit, no point in trying more approaches
          break;
        }
        continue;
      }
    }

    console.log('[AlphaVantage] All approaches failed, returning empty array');
    return [];
  }

  private parseTimePublished(timePublished: string): Date {
    // Handle Alpha Vantage compact format (YYYYMMDDTHHMMSS) and ISO format
    if (/^\d{8}T\d{6}$/.test(timePublished)) {
      // Compact format: 20240910T143000
      const year = parseInt(timePublished.substring(0, 4));
      const month = parseInt(timePublished.substring(4, 6)) - 1; // Month is 0-indexed
      const day = parseInt(timePublished.substring(6, 8));
      const hour = parseInt(timePublished.substring(9, 11));
      const minute = parseInt(timePublished.substring(11, 13));
      const second = parseInt(timePublished.substring(13, 15));
      return new Date(year, month, day, hour, minute, second);
    } else {
      // Try ISO format or other standard formats
      return new Date(timePublished);
    }
  }

  private parseNewsToEvents(newsItems: AlphaVantageNewsItem[]): ParsedNewsEvent[] {
    return newsItems.map((item, index) => {
      // Extract economic indicators or data from the news content
      const isHighImpact = item.overall_sentiment_score && Math.abs(item.overall_sentiment_score) > 0.3;
      const isMediumImpact = item.topics && item.topics.some(topic => 
        topic.topic.includes('earnings') || 
        topic.topic.includes('financial_markets') ||
        parseFloat(topic.relevance_score) > 0.7
      );
      
      const impact: 'low' | 'medium' | 'high' = 
        isHighImpact ? 'high' : 
        isMediumImpact ? 'medium' : 'low';

      // Robust time parsing
      const eventTime = this.parseTimePublished(item.time_published);
      
      return {
        id: `av-${index}-${Date.now()}`,
        title: item.title,
        description: item.summary || item.title,
        currency: 'USD' as const,
        impact,
        eventTime,
        actualValue: undefined,
        forecastValue: undefined,
        previousValue: undefined,
        source: item.source || 'Alpha Vantage',
        sourceUrl: item.url || 'https://www.alphavantage.co'
      };
    }).filter(event => {
      // Much looser filtering - accept most financial/economic content
      const title = event.title.toLowerCase();
      const description = event.description.toLowerCase();
      
      // Broad financial keywords
      const financialKeywords = [
        'fed', 'federal', 'central bank', 'interest rate', 'monetary policy',
        'inflation', 'cpi', 'pce', 'employment', 'unemployment', 'jobs', 'payroll',
        'gdp', 'economic', 'economy', 'recession', 'growth',
        'market', 'stock', 'trading', 'wall street', 'nasdaq', 'dow',
        'dollar', 'usd', 'currency', 'forex', 'exchange rate',
        'treasury', 'bond', 'yield', 'debt', 'fiscal',
        'earnings', 'corporate', 'company', 'business',
        'oil', 'gold', 'commodity', 'price', 'cost'
      ];
      
      return financialKeywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      ) || event.impact !== 'low'; // Always include medium/high impact items
    });
  }

  async fetchFinancialNews(): Promise<ParsedNewsEvent[]> {
    // Check cache first
    const cacheKey = 'financial-news';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < this.cacheExpiry)) {
      return cached.data;
    }

    const newsItems = await this.fetchNewsData();
    const parsedEvents = this.parseNewsToEvents(newsItems);
    
    // Cache the results
    this.cache.set(cacheKey, {
      data: parsedEvents,
      timestamp: Date.now()
    });

    return parsedEvents;
  }

  async getRecentNews(limit: number = 5): Promise<ParsedNewsEvent[]> {
    const allNews = await this.fetchFinancialNews();
    const now = new Date();
    
    // Filter for news in the past 7 days
    const recentNews = allNews.filter(news => {
      const daysDiff = (now.getTime() - news.eventTime.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff <= 7;
    });

    // Sort by time (most recent first) and limit
    return recentNews
      .sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime())
      .slice(0, limit);
  }

  async getUpcomingNews(limit: number = 5): Promise<ParsedNewsEvent[]> {
    const allNews = await this.fetchFinancialNews();
    const now = new Date();
    
    // For news API, we don't have "upcoming" events, so we'll return recent high-impact news
    const relevantNews = allNews.filter(news => {
      const daysDiff = Math.abs(now.getTime() - news.eventTime.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 2 && news.impact !== 'low'; // Recent high/medium impact news
    });

    // Sort by impact and recency
    return relevantNews
      .sort((a, b) => {
        const impactScore = { high: 3, medium: 2, low: 1 };
        const impactDiff = impactScore[b.impact] - impactScore[a.impact];
        if (impactDiff !== 0) return impactDiff;
        return new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime();
      })
      .slice(0, limit);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const alphaVantageService = new AlphaVantageService();