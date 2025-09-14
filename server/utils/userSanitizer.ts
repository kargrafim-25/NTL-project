import { User } from "@shared/schema";

/**
 * Remove sensitive fields from user object before sending to client
 */
export function sanitizeUser(user: User | null | undefined): Omit<User, 'password' | 'emailVerificationToken' | 'phoneVerificationToken' | 'verificationTokenExpiry'> | null {
  if (!user) return null;

  const { 
    password, 
    emailVerificationToken, 
    phoneVerificationToken, 
    verificationTokenExpiry,
    ...safeUser 
  } = user;

  return safeUser;
}

/**
 * Sanitize multiple users
 */
export function sanitizeUsers(users: User[]): Array<Omit<User, 'password' | 'emailVerificationToken' | 'phoneVerificationToken' | 'verificationTokenExpiry'>> {
  return users.map(user => sanitizeUser(user)).filter(Boolean) as any[];
}