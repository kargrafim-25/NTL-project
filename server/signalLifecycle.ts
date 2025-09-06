import { storage } from "./storage";

// Define timeframe durations in milliseconds
const TIMEFRAME_DURATIONS = {
  // Fresh period - all signals start as fresh for 15 minutes
  FRESH_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // Running periods by timeframe
  '5M': 2 * 60 * 60 * 1000,      // 2 hours
  '15M': 2 * 60 * 60 * 1000,     // 2 hours  
  '30M': 24 * 60 * 60 * 1000,    // 1 day
  '1H': 24 * 60 * 60 * 1000,     // 1 day
  '4H': 2 * 24 * 60 * 60 * 1000, // 2 days
  '1D': 7 * 24 * 60 * 60 * 1000, // 1 week
  '1W': 60 * 24 * 60 * 60 * 1000 // 2 months (60 days)
};

export function getSignalStatus(createdAt: Date, timeframe: string): 'fresh' | 'active' | 'closed' {
  const now = new Date();
  const age = now.getTime() - createdAt.getTime();
  
  // First 15 minutes: fresh
  if (age < TIMEFRAME_DURATIONS.FRESH_DURATION) {
    return 'fresh';
  }
  
  // Check if signal should be closed based on timeframe
  const runningDuration = TIMEFRAME_DURATIONS[timeframe as keyof typeof TIMEFRAME_DURATIONS];
  if (runningDuration && age > runningDuration) {
    return 'closed';
  }
  
  // Otherwise it's active/running
  return 'active';
}

export async function updateSignalStatuses() {
  try {
    // Get all signals that are not manually stopped
    const signals = await storage.getAllActiveSignals();
    
    for (const signal of signals) {
      const currentStatus = getSignalStatus(signal.createdAt!, signal.timeframe);
      
      // Only update if status has changed
      if (signal.status !== currentStatus) {
        await storage.updateSignalStatus(signal.id, currentStatus);
        console.log(`Updated signal ${signal.id} from ${signal.status} to ${currentStatus}`);
      }
    }
  } catch (error) {
    console.error('Error updating signal statuses:', error);
  }
}

// Run signal lifecycle updates every 5 minutes
export function startSignalLifecycleService() {
  console.log('Starting signal lifecycle service...');
  
  // Run immediately
  updateSignalStatuses();
  
  // Then run every 5 minutes
  setInterval(updateSignalStatuses, 5 * 60 * 1000);
}