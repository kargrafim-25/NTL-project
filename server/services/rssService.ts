import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  category?: string;
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

export class RSSService {
  private parser: XMLParser;
  private cache: Map<string, { data: ParsedNewsEvent[], timestamp: number }> = new Map();
  private cacheExpiry = 15 * 60 * 1000; // 15 minutes cache

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
      parseTagValue: false
    });
  }

  private async fetchRSSFeed(url: string, source: string): Promise<RSSItem[]> {
    try {
      console.log(`[RSS] Fetching from ${source}: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Next Trading Labs/1.0 (Financial News Aggregator)',
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (!response.data) {
        console.log(`[RSS] Empty response from ${source}`);
        return [];
      }

      const parsed = this.parser.parse(response.data);
      const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
      const rssItems: RSSItem[] = Array.isArray(items) ? items : [items];

      console.log(`[RSS] Successfully parsed ${rssItems.length} items from ${source}`);
      return rssItems.map((item: any) => ({
        title: item.title || '',
        link: (typeof item.link === 'object' && item.link?.href) ? item.link.href : (item.link || ''),
        pubDate: item.pubDate || item.published || item.updated || new Date().toISOString(),
        description: item.description || item.summary || item.content || item.title || '',
        category: item.category
      }));

    } catch (error: any) {
      console.log(`[RSS] Failed to fetch from ${source}: ${error.message}`);
      return [];
    }
  }

  private parseRSSToEvents(items: RSSItem[], source: string): ParsedNewsEvent[] {
    return items.map((item, index) => {
      const title = typeof item.title === 'string' ? item.title : item.title?.['#text'] || '';
      const description = typeof item.description === 'string' ? item.description : 
                         item.description?.['#text'] || title;
      
      // Determine impact based on keywords and source
      const titleLower = title.toLowerCase();
      const isHighImpact = titleLower.includes('fed') || titleLower.includes('federal reserve') ||
                          titleLower.includes('inflation') || titleLower.includes('interest rate') ||
                          titleLower.includes('gdp') || titleLower.includes('unemployment');
      
      const isMediumImpact = titleLower.includes('market') || titleLower.includes('economic') ||
                            titleLower.includes('earnings') || titleLower.includes('trade') ||
                            titleLower.includes('dollar') || titleLower.includes('oil');

      const impact: 'low' | 'medium' | 'high' = 
        isHighImpact ? 'high' : 
        isMediumImpact ? 'medium' : 'low';

      // Parse date
      let eventTime: Date;
      try {
        eventTime = new Date(item.pubDate);
        if (isNaN(eventTime.getTime())) {
          eventTime = new Date(); // Fallback to current time
        }
      } catch {
        eventTime = new Date();
      }

      return {
        id: `rss-${source.toLowerCase()}-${index}-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        currency: 'USD' as const,
        impact,
        eventTime,
        actualValue: undefined,
        forecastValue: undefined,
        previousValue: undefined,
        source: source,
        sourceUrl: item.link || `https://${source.toLowerCase()}.com`
      };
    }).filter(event => {
      // EXTREMELY strict filtering - only core USD economic data
      const title = event.title.toLowerCase();
      const description = event.description.toLowerCase();
      const content = (title + ' ' + description);
      
      // Exclude all corporate/business news first
      const excludeKeywords = [
        'company', 'corporation', 'ceo', 'executive', 'earnings', 'quarterly',
        'stock price', 'stock surge', 'stock fall', 'analyst', 'upgrade', 'downgrade',
        'merger', 'acquisition', 'deal', 'partnership', 'investment',
        'crypto', 'bitcoin', 'ethereum', 'blockchain', 'cryptocurrency',
        'software', 'technology', 'app', 'digital', 'product launch',
        'real estate', 'property', 'housing market', 'construction',
        'lawsuit', 'legal', 'court', 'settlement', 'investigation',
        'sport', 'entertainment', 'gaming', 'movie', 'celebrity',
        'private equity', 'venture capital', 'fund', 'carlyle', 'red bull'
      ];
      
      const hasExcludeKeywords = excludeKeywords.some(keyword => content.includes(keyword));
      if (hasExcludeKeywords) {
        return false;
      }
      
      // Only include core economic indicators
      const usdEconomicKeywords = [
        'federal reserve', 'fed meeting', 'fed decision', 'jerome powell',
        'interest rate', 'rate cut', 'rate hike', 'monetary policy',
        'inflation report', 'cpi data', 'consumer price index',
        'unemployment rate', 'jobs report', 'nonfarm payroll',
        'gdp report', 'economic growth', 'recession',
        'dollar index', 'usd', 'currency policy', 'exchange rate',
        'treasury yield', 'bond market', 'government bond'
      ];
      
      return usdEconomicKeywords.some(keyword => content.includes(keyword));
    });
  }

  async fetchFinancialNewsFromRSS(): Promise<ParsedNewsEvent[]> {
    // Check cache first
    const cacheKey = 'rss-financial-news';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < this.cacheExpiry)) {
      return cached.data;
    }

    const rssFeeds = [
      { url: 'https://feeds.reuters.com/news/wealth', source: 'Reuters' },
      { url: 'https://feeds.reuters.com/reuters/businessNews', source: 'Reuters Business' },
      { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147', source: 'CNBC Markets' },
      { url: 'https://rss.cnn.com/rss/money_latest.rss', source: 'CNN Business' }
    ];

    const allEvents: ParsedNewsEvent[] = [];

    // Fetch from multiple RSS feeds in parallel
    const promises = rssFeeds.map(async feed => {
      try {
        const items = await this.fetchRSSFeed(feed.url, feed.source);
        return this.parseRSSToEvents(items, feed.source);
      } catch (error) {
        console.log(`[RSS] Error processing ${feed.source}: ${error}`);
        return [];
      }
    });

    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allEvents.push(...result.value);
      } else {
        console.log(`[RSS] Failed to process feed ${rssFeeds[index].source}`);
      }
    });

    // Sort by date (most recent first) and limit
    const sortedEvents = allEvents
      .sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime())
      .slice(0, 30); // Keep top 30 most recent

    console.log(`[RSS] Successfully aggregated ${sortedEvents.length} financial news items from RSS feeds`);

    // Cache the results
    this.cache.set(cacheKey, {
      data: sortedEvents,
      timestamp: Date.now()
    });

    return sortedEvents;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const rssService = new RSSService();