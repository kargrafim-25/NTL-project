import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from '@getbrevo/brevo';
import crypto from 'crypto';

// Initialize Brevo email API
const emailApi = new TransactionalEmailsApi();
if (!process.env.BREVO_API_KEY) {
  throw new Error("BREVO_API_KEY environment variable must be set");
}
emailApi.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

interface VerificationResult {
  success: boolean;
  token?: string;
  expiresAt?: Date;
  error?: string;
}

interface EmailParams {
  to: string;
  firstName?: string;
  token: string;
}

interface SMSParams {
  phoneNumber: string;
  token: string;
}

export class VerificationService {
  
  // Generate 6-digit OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate secure verification token
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Calculate expiry time (10 minutes from now)
  getExpiryTime(): Date {
    return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  }

  // Send email verification
  async sendEmailVerification(params: EmailParams): Promise<VerificationResult> {
    try {
      const emailData = {
        to: [{ email: params.to, name: params.firstName || 'User' }],
        subject: 'Verify your Next Trading Labs account',
        htmlContent: `
          <div style="max-width: 600px; margin: 0 auto; font-family: 'Arial', sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">Next Trading Labs</h1>
              <p style="color: #9ca3af; margin: 5px 0 0 0;">AI-Powered Trading Platform</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f1419 100%); padding: 30px; border-radius: 12px; border: 1px solid #334155;">
              <h2 style="color: #e2e8f0; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email Address</h2>
              
              <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 30px;">
                ${params.firstName ? `Hi ${params.firstName},` : 'Hello,'}<br><br>
                Welcome to Next Trading Labs! To complete your registration and start accessing our AI-powered trading signals, please verify your email address.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #3b82f6; color: white; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px; display: inline-block; font-family: 'Courier New', monospace;">
                  ${params.token}
                </div>
                <p style="color: #64748b; font-size: 14px; margin-top: 15px;">
                  This verification code expires in 10 minutes
                </p>
              </div>
              
              <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #f1f5f9; margin: 0 0 10px 0; font-size: 16px;">Security Notice:</h3>
                <ul style="color: #94a3b8; margin: 0; padding-left: 20px; line-height: 1.6;">
                  <li>Never share this code with anyone</li>
                  <li>Our team will never ask for verification codes</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>
              
              <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
                Need help? Contact our support team at support@nexttradinglab.com
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 12px;">
              <p>Next Trading Labs - Professional AI Trading Platform</p>
              <p>This email was sent to ${params.to}</p>
            </div>
          </div>
        `,
        textContent: `
Next Trading Labs - Email Verification

${params.firstName ? `Hi ${params.firstName},` : 'Hello,'}

Welcome to Next Trading Labs! Please use this verification code to complete your registration:

VERIFICATION CODE: ${params.token}

This code expires in 10 minutes.

Security Notice:
- Never share this code with anyone
- Our team will never ask for verification codes
- If you didn't request this, please ignore this email

Need help? Contact support@nexttradinglab.com

Next Trading Labs - Professional AI Trading Platform
        `,
        sender: { 
          email: 'noreply@nexttradinglab.com', 
          name: 'Next Trading Labs' 
        }
      };

      await emailApi.sendTransacEmail(emailData);
      
      return {
        success: true,
        token: params.token,
        expiresAt: this.getExpiryTime()
      };
    } catch (error) {
      console.error('Brevo email verification error:', error);
      return {
        success: false,
        error: 'Failed to send verification email'
      };
    }
  }

  // Send SMS verification (placeholder for now - will implement with SMS service)
  async sendSMSVerification(params: SMSParams): Promise<VerificationResult> {
    try {
      // For now, just log the SMS (in production, integrate with SMS provider like Twilio)
      console.log(`SMS Verification Code for ${params.phoneNumber}: ${params.token}`);
      
      // TODO: Implement actual SMS sending with Twilio or similar service
      
      return {
        success: true,
        token: params.token,
        expiresAt: this.getExpiryTime()
      };
    } catch (error) {
      console.error('SMS verification error:', error);
      return {
        success: false,
        error: 'Failed to send verification SMS'
      };
    }
  }

  // Verify token format (6 digits for OTP)
  isValidOTPFormat(token: string): boolean {
    return /^\d{6}$/.test(token);
  }

  // Check if token is expired
  isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }
}

export const verificationService = new VerificationService();