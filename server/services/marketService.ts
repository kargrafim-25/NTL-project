export function isMarketOpen(): boolean {
  try {
    // Get current time in Casablanca timezone
    const now = new Date();
    const casablancaTime = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Casablanca"}));
    
    const dayOfWeek = casablancaTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = casablancaTime.getHours();
    const minute = casablancaTime.getMinutes();
    
    // Gold market operates Sunday 10PM - Friday 9PM (Casablanca time)
    
    // Market is closed on Saturday
    if (dayOfWeek === 6) {
      return false;
    }
    
    // Sunday: market opens at 10 PM
    if (dayOfWeek === 0) {
      return hour >= 22;
    }
    
    // Monday to Thursday: market is open 24 hours
    if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      return true;
    }
    
    // Friday: market closes at 9 PM
    if (dayOfWeek === 5) {
      return hour < 21 || (hour === 21 && minute === 0);
    }
    
    return false;
    
  } catch (error) {
    console.error("Error checking market hours:", error);
    // Default to closed if there's an error
    return false;
  }
}

export function getMarketStatus(): {
  isOpen: boolean;
  message: string;
  nextOpen?: string;
  nextClose?: string;
} {
  const isOpen = isMarketOpen();
  
  if (isOpen) {
    return {
      isOpen: true,
      message: "Gold market is currently open"
    };
  } else {
    return {
      isOpen: false,
      message: "Gold market is currently closed"
    };
  }
}
