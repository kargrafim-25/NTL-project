import type { RequestHandler } from "express";
import { User } from "@shared/schema";

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// New authentication middleware for independent auth system
export const isIndependentlyAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    const user = (req.session as any)?.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ message: "Account is disabled" });
    }

    // Check if account is locked
    if (user.accountLocked) {
      return res.status(401).json({ message: "Account is locked" });
    }

    // Add user to request object for route handlers
    req.user = user;
    
    return next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
};

// Admin-only middleware
export const requireAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    const user = req.user;
    
    if (!user || user.subscriptionTier !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    return next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ message: "Authorization error" });
  }
};

// Role-based middleware factory
export const requireRole = (roles: string[]): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      const user = req.user;
      
      if (!user || !roles.includes(user.subscriptionTier)) {
        return res.status(403).json({ 
          message: `Access denied. Required roles: ${roles.join(', ')}` 
        });
      }
      
      return next();
    } catch (error) {
      console.error("Role middleware error:", error);
      return res.status(500).json({ message: "Authorization error" });
    }
  };
};