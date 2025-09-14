import bcrypt from 'bcryptjs';
import { storage } from '../storage';
import { User } from '@shared/schema';

export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Register a new user with email and password
   */
  async register(email: string, password: string, firstName: string, lastName: string): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const user = await storage.upsertUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        emailVerified: false,
        subscriptionTier: 'free',
        isActive: true
      });

      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Record failed attempt
        await this.recordFailedLoginAttempt(email);
        return { success: false, error: 'Invalid email or password' };
      }

      // Check if account is locked
      if (user.accountLocked) {
        return { success: false, error: 'Account is locked. Please contact support.' };
      }

      // Check if account is active
      if (!user.isActive) {
        return { success: false, error: 'Account is disabled. Please contact support.' };
      }

      // Verify password
      if (!user.password || !(await this.verifyPassword(password, user.password))) {
        await this.recordFailedLoginAttempt(email, user.id);
        return { success: false, error: 'Invalid email or password' };
      }

      // Reset login attempts on successful login
      await this.resetLoginAttempts(user.id);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  /**
   * Record failed login attempt and lock account if necessary
   */
  private async recordFailedLoginAttempt(email: string, userId?: string): Promise<void> {
    if (!userId) return; // Can't record attempts for non-existent users
    
    const user = await storage.getUser(userId);
    if (!user) return;

    const attempts = (user.loginAttempts || 0) + 1;
    const shouldLock = attempts >= 5; // Lock after 5 failed attempts

    await storage.updateUserLoginAttempts(userId, attempts, shouldLock);

    if (shouldLock) {
      console.log(`Account locked for user ${userId} after ${attempts} failed attempts`);
    }
  }

  /**
   * Reset login attempts counter
   */
  private async resetLoginAttempts(userId: string): Promise<void> {
    await storage.updateUserLoginAttempts(userId, 0, false);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    return { valid: true };
  }

  /**
   * Create a default admin user if none exists
   */
  async createDefaultAdmin(): Promise<void> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        console.log('ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin creation.');
        return;
      }

      const existingAdmin = await storage.getUserByEmail(adminEmail);
      if (existingAdmin) {
        // Update existing user to admin if not already
        if (existingAdmin.subscriptionTier !== 'admin') {
          await storage.upsertUser({
            ...existingAdmin,
            subscriptionTier: 'admin'
          });
          console.log(`Updated existing user ${adminEmail} to admin role`);
        }
        return;
      }

      // Create admin user
      const hashedPassword = await this.hashPassword(adminPassword);
      await storage.upsertUser({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        subscriptionTier: 'admin',
        emailVerified: true,
        isActive: true
      });

      console.log(`Created admin user: ${adminEmail}`);
    } catch (error) {
      console.error('Error creating admin user:', error);
    }
  }
}

export const authService = AuthService.getInstance();