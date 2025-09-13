import { Request } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstAttempt: number;
}

class RateLimitService {
  private sendLimits = new Map<string, RateLimitEntry>();
  private verifyLimits = new Map<string, RateLimitEntry>();
  
  private readonly SEND_WINDOW_MS = 60 * 1000; // 1 minute
  private readonly VERIFY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_SEND_ATTEMPTS = 3; // 3 sends per minute
  private readonly MAX_VERIFY_ATTEMPTS = 5; // 5 verify attempts per 10 minutes

  private cleanup() {
    const now = Date.now();
    
    // Clean up expired send limits
    Array.from(this.sendLimits.entries()).forEach(([key, entry]) => {
      if (now > entry.resetTime) {
        this.sendLimits.delete(key);
      }
    });
    
    // Clean up expired verify limits
    Array.from(this.verifyLimits.entries()).forEach(([key, entry]) => {
      if (now > entry.resetTime) {
        this.verifyLimits.delete(key);
      }
    });
  }

  private getIdentifier(req: Request, userId?: string): string {
    // Use userId if available, otherwise fall back to IP
    if (userId) {
      return `user:${userId}`;
    }
    return `ip:${req.ip || req.connection.remoteAddress || 'unknown'}`;
  }

  checkSendLimit(req: Request, userId?: string): { allowed: boolean; resetTime?: number; remainingAttempts?: number } {
    this.cleanup();
    
    const identifier = this.getIdentifier(req, userId);
    const now = Date.now();
    const entry = this.sendLimits.get(identifier);

    if (!entry) {
      // First attempt
      this.sendLimits.set(identifier, {
        count: 1,
        resetTime: now + this.SEND_WINDOW_MS,
        firstAttempt: now
      });
      return { allowed: true, remainingAttempts: this.MAX_SEND_ATTEMPTS - 1 };
    }

    if (now > entry.resetTime) {
      // Window expired, reset
      this.sendLimits.set(identifier, {
        count: 1,
        resetTime: now + this.SEND_WINDOW_MS,
        firstAttempt: now
      });
      return { allowed: true, remainingAttempts: this.MAX_SEND_ATTEMPTS - 1 };
    }

    if (entry.count >= this.MAX_SEND_ATTEMPTS) {
      // Rate limit exceeded
      return { 
        allowed: false, 
        resetTime: entry.resetTime,
        remainingAttempts: 0
      };
    }

    // Increment count
    entry.count++;
    return { 
      allowed: true, 
      remainingAttempts: this.MAX_SEND_ATTEMPTS - entry.count 
    };
  }

  checkVerifyLimit(req: Request, userId?: string): { allowed: boolean; resetTime?: number; remainingAttempts?: number } {
    this.cleanup();
    
    const identifier = this.getIdentifier(req, userId);
    const now = Date.now();
    const entry = this.verifyLimits.get(identifier);

    if (!entry) {
      // First attempt
      this.verifyLimits.set(identifier, {
        count: 1,
        resetTime: now + this.VERIFY_WINDOW_MS,
        firstAttempt: now
      });
      return { allowed: true, remainingAttempts: this.MAX_VERIFY_ATTEMPTS - 1 };
    }

    if (now > entry.resetTime) {
      // Window expired, reset
      this.verifyLimits.set(identifier, {
        count: 1,
        resetTime: now + this.VERIFY_WINDOW_MS,
        firstAttempt: now
      });
      return { allowed: true, remainingAttempts: this.MAX_VERIFY_ATTEMPTS - 1 };
    }

    if (entry.count >= this.MAX_VERIFY_ATTEMPTS) {
      // Rate limit exceeded
      return { 
        allowed: false, 
        resetTime: entry.resetTime,
        remainingAttempts: 0
      };
    }

    // Increment count
    entry.count++;
    return { 
      allowed: true, 
      remainingAttempts: this.MAX_VERIFY_ATTEMPTS - entry.count 
    };
  }

  resetUserLimits(userId: string) {
    // Reset both send and verify limits for a specific user
    this.sendLimits.delete(`user:${userId}`);
    this.verifyLimits.delete(`user:${userId}`);
  }

  getLimitInfo(req: Request, userId?: string, type: 'send' | 'verify' = 'send') {
    const identifier = this.getIdentifier(req, userId);
    const limitsMap = type === 'send' ? this.sendLimits : this.verifyLimits;
    const maxAttempts = type === 'send' ? this.MAX_SEND_ATTEMPTS : this.MAX_VERIFY_ATTEMPTS;
    
    const entry = limitsMap.get(identifier);
    if (!entry) {
      return {
        attempts: 0,
        maxAttempts,
        resetTime: null,
        windowMs: type === 'send' ? this.SEND_WINDOW_MS : this.VERIFY_WINDOW_MS
      };
    }

    return {
      attempts: entry.count,
      maxAttempts,
      resetTime: entry.resetTime,
      windowMs: type === 'send' ? this.SEND_WINDOW_MS : this.VERIFY_WINDOW_MS
    };
  }
}

export const rateLimitService = new RateLimitService();