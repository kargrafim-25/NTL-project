import { format, addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

interface ForexFactoryEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  date: string;
  time: string;
  impact: 'low' | 'medium' | 'high';
  forecast: string;
  previous: string;
  actual?: string;
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

export class ForexFactoryService {
  private baseUrl = 'https://www.forexfactory.com';
  private cache: Map<string, { data: ParsedNewsEvent[], timestamp: number }> = new Map();
  private cacheExpiry = 15 * 60 * 1000; // 15 minutes

  // Generate sample data that mimics ForexFactory structure
  private generateSampleData(): ForexFactoryEvent[] {
    const today = new Date();
    const events: ForexFactoryEvent[] = [
      {
        id: 'ff-1',
        title: 'Non-Farm Employment Change',
        country: 'United States',
        currency: 'USD',
        date: format(addDays(today, 1), 'yyyy-MM-dd'),
        time: '13:30',
        impact: 'high',
        forecast: '150K',
        previous: '142K'
      },
      {
        id: 'ff-2',
        title: 'Consumer Price Index (YoY)',
        country: 'United States',
        currency: 'USD',
        date: format(today, 'yyyy-MM-dd'),
        time: '13:30',
        impact: 'high',
        forecast: '3.2%',
        previous: '3.4%',
        actual: '3.1%'
      },
      {
        id: 'ff-3',
        title: 'Federal Funds Rate',
        country: 'United States',
        currency: 'USD',
        date: format(addDays(today, 2), 'yyyy-MM-dd'),
        time: '19:00',
        impact: 'high',
        forecast: '5.50%',
        previous: '5.50%'
      },
      {
        id: 'ff-4',
        title: 'Gross Domestic Product (QoQ)',
        country: 'United States',
        currency: 'USD',
        date: format(addDays(today, -1), 'yyyy-MM-dd'),
        time: '13:30',
        impact: 'high',
        forecast: '2.1%',
        previous: '2.0%',
        actual: '2.3%'
      },
      {
        id: 'ff-5',
        title: 'ISM Manufacturing PMI',
        country: 'United States',
        currency: 'USD',
        date: format(today, 'yyyy-MM-dd'),
        time: '15:00',
        impact: 'medium',
        forecast: '48.5',
        previous: '47.2%'
      },
      {
        id: 'ff-6',
        title: 'Unemployment Claims',
        country: 'United States',
        currency: 'USD',
        date: format(addDays(today, 1), 'yyyy-MM-dd'),
        time: '13:30',
        impact: 'medium',
        forecast: '220K',
        previous: '218K'
      }
    ];

    return events;
  }

  private parseForexFactoryEvents(events: ForexFactoryEvent[]): ParsedNewsEvent[] {
    return events.map(event => {
      const eventDateTime = new Date(`${event.date}T${event.time}:00.000Z`);
      
      return {
        id: event.id,
        title: event.title,
        description: `${event.country} economic indicator: ${event.title}`,
        currency: event.currency as 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF',
        impact: event.impact,
        eventTime: eventDateTime,
        actualValue: event.actual || undefined,
        forecastValue: event.forecast || undefined,
        previousValue: event.previous || undefined,
        source: 'ForexFactory',
        sourceUrl: `${this.baseUrl}/calendar`
      };
    });
  }

  async fetchCalendarData(): Promise<ParsedNewsEvent[]> {
    // Check cache first
    const cacheKey = 'calendar-data';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < this.cacheExpiry)) {
      return cached.data;
    }

    try {
      // For now, we'll use sample data that mimics ForexFactory structure
      // In a real implementation, you would scrape the actual website
      const sampleEvents = this.generateSampleData();
      const parsedEvents = this.parseForexFactoryEvents(sampleEvents);
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: parsedEvents,
        timestamp: Date.now()
      });

      return parsedEvents;
    } catch (error) {
      console.error('Error fetching ForexFactory calendar data:', error);
      // Return cached data if available, otherwise empty array
      return cached?.data || [];
    }
  }

  async getRecentNews(limit: number = 5): Promise<ParsedNewsEvent[]> {
    const allEvents = await this.fetchCalendarData();
    const now = new Date();
    
    // Filter for events in the past 7 days
    const recentEvents = allEvents.filter(event => {
      const eventDate = new Date(event.eventTime);
      const daysDiff = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff <= 7;
    });

    // Sort by event time (most recent first) and limit
    return recentEvents
      .sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime())
      .slice(0, limit);
  }

  async getUpcomingNews(limit: number = 5): Promise<ParsedNewsEvent[]> {
    const allEvents = await this.fetchCalendarData();
    const now = new Date();
    
    // Filter for future events in the next 7 days
    const upcomingEvents = allEvents.filter(event => {
      const eventDate = new Date(event.eventTime);
      const daysDiff = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff <= 7;
    });

    // Sort by event time (soonest first) and limit
    return upcomingEvents
      .sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime())
      .slice(0, limit);
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear();
  }
}

export const forexFactoryService = new ForexFactoryService();