import { storage } from "../storage";
import type { InsertEconomicNews } from "@shared/schema";

// Sample high-impact USD economic news data
const sampleNewsData: Omit<InsertEconomicNews, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: "Federal Reserve Interest Rate Decision",
    description: "FOMC announces interest rate decision and monetary policy outlook",
    currency: "USD",
    impact: "high",
    eventTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    isArchived: false,
    previousValue: "5.25%",
    forecastValue: "5.50%",
    actualValue: null,
  },
  {
    title: "US Non-Farm Payrolls",
    description: "Monthly employment data showing job creation and unemployment rate",
    currency: "USD",
    impact: "high",
    eventTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    isArchived: false,
    previousValue: "150K",
    forecastValue: "175K",
    actualValue: null,
  },
  {
    title: "Consumer Price Index (CPI)",
    description: "Monthly inflation data measuring price changes in consumer goods",
    currency: "USD",
    impact: "high",
    eventTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    isArchived: false,
    previousValue: "3.2%",
    forecastValue: "3.1%",
    actualValue: null,
  },
  {
    title: "GDP Quarterly Report",
    description: "Economic growth data for the previous quarter",
    currency: "USD",
    impact: "high",
    eventTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isArchived: false,
    previousValue: "2.1%",
    forecastValue: "2.3%",
    actualValue: "2.4%",
  },
  {
    title: "Federal Reserve Chair Speech",
    description: "Jerome Powell speaks on monetary policy and economic outlook",
    currency: "USD",
    impact: "high",
    eventTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    isArchived: false,
    previousValue: null,
    forecastValue: null,
    actualValue: null,
  }
];

export async function initializeSampleNews(): Promise<void> {
  try {
    console.log("Initializing sample economic news data...");
    
    for (const newsItem of sampleNewsData) {
      await storage.createNews(newsItem);
    }
    
    console.log(`Successfully added ${sampleNewsData.length} news items`);
  } catch (error) {
    console.error("Error initializing sample news:", error);
  }
}

export async function getLatestEconomicNews(limit: number = 10) {
  try {
    const [upcoming, recent] = await Promise.all([
      storage.getUpcomingNews(limit, 'USD', 'high'),
      storage.getRecentNews(limit, 'USD', 'high')
    ]);
    
    return {
      upcoming,
      recent,
      total: upcoming.length + recent.length
    };
  } catch (error) {
    console.error("Error fetching economic news:", error);
    return {
      upcoming: [],
      recent: [],
      total: 0
    };
  }
}

export async function addEconomicNews(newsData: Omit<InsertEconomicNews, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    return await storage.createNews(newsData);
  } catch (error) {
    console.error("Error adding economic news:", error);
    throw error;
  }
}