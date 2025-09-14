import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Check, Mail, Phone, Clock, Shield } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Country codes data
const COUNTRY_CODES = [
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+43", country: "Austria", flag: "🇦🇹" },
  { code: "+32", country: "Belgium", flag: "🇧🇪" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+30", country: "Greece", flag: "🇬🇷" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+51", country: "Peru", flag: "🇵🇪" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" }
];

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userEmail?: string;
  userPhone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

interface VerificationResponse {
  success: boolean;
  message: string;
  expiresIn?: number;
  resetTime?: number;
  remainingAttempts?: number;
}

export default function VerificationModal({
  isOpen,
  onClose,
  onComplete,
  userEmail,
  userPhone,
  emailVerified = false,
  phoneVerified = false
}: VerificationModalProps) {
  const { toast } = useToast();
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);
  const [emailVerificationComplete, setEmailVerificationComplete] = useState(emailVerified);
  const [phoneVerificationComplete, setPhoneVerificationComplete] = useState(phoneVerified);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cooldowns, setCooldowns] = useState<{
    email: number;
    phone: number;
    emailVerify: number;
    phoneVerify: number;
  }>({
    email: 0,
    phone: 0,
    emailVerify: 0,
    phoneVerify: 0
  });

  // Update verification status when props change
  useEffect(() => {
    setEmailVerificationComplete(emailVerified);
    setPhoneVerificationComplete(phoneVerified);
  }, [emailVerified, phoneVerified]);

  // Check completion status when verification states change
  useEffect(() => {
    if (emailVerificationComplete && phoneVerificationComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [emailVerificationComplete, phoneVerificationComplete, onComplete]);

  // Cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldowns(prev => ({
        email: Math.max(0, prev.email - 1),
        phone: Math.max(0, prev.phone - 1),
        emailVerify: Math.max(0, prev.emailVerify - 1),
        phoneVerify: Math.max(0, prev.phoneVerify - 1)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Send email verification
  const sendEmailVerification = useMutation({
    mutationFn: async (): Promise<VerificationResponse> => {
      const response = await apiRequest('POST', '/api/auth/send-email-verification', {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setEmailSent(true);
        toast({
          title: "Verification Code Sent",
          description: data.message || "Check your email for the verification code.",
        });
      } else {
        toast({
          title: "Failed to Send Code",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      let errorData = {};
      try {
        errorData = error.message ? JSON.parse(error.message) : {};
      } catch (e) {
        // If JSON parsing fails, create a safe fallback object
        errorData = { message: error.message || "Failed to send verification code" };
      }
      
      if (errorData.resetTime) {
        const resetInSeconds = Math.ceil((errorData.resetTime - Date.now()) / 1000);
        setCooldowns(prev => ({ ...prev, email: resetInSeconds }));
      }
      
      toast({
        title: "Error",
        description: errorData.message || "Failed to send verification code",
        variant: "destructive",
      });
    }
  });

  // Send phone verification
  const sendPhoneVerification = useMutation({
    mutationFn: async (): Promise<VerificationResponse> => {
      // If no existing phone, use the new phone number with country code
      const phoneToVerify = userPhone || `${selectedCountryCode}${phoneNumber}`;
      const response = await apiRequest('POST', '/api/auth/send-phone-verification', {
        phoneNumber: phoneToVerify
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setPhoneSent(true);
        toast({
          title: "Verification Code Sent",
          description: data.message || "Check your phone for the verification code.",
        });
      } else {
        toast({
          title: "Failed to Send Code",
          description: data.message || "Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      let errorData = {};
      try {
        errorData = error.message ? JSON.parse(error.message) : {};
      } catch (e) {
        // If JSON parsing fails, create a safe fallback object
        errorData = { message: error.message || "Failed to send verification code" };
      }
      
      if (errorData.resetTime) {
        const resetInSeconds = Math.ceil((errorData.resetTime - Date.now()) / 1000);
        setCooldowns(prev => ({ ...prev, phone: resetInSeconds }));
      }
      
      toast({
        title: "Error",
        description: errorData.message || "Failed to send verification code",
        variant: "destructive",
      });
    }
  });

  // Verify email code
  const verifyEmailCode = useMutation({
    mutationFn: async (token: string): Promise<VerificationResponse> => {
      const response = await apiRequest('POST', '/api/auth/verify-email', { token });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setEmailVerificationComplete(true);
        setEmailCode("");
        toast({
          title: "Email Verified!",
          description: data.message || "Your email has been successfully verified.",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid verification code.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      let errorData = {};
      try {
        errorData = error.message ? JSON.parse(error.message) : {};
      } catch (e) {
        // If JSON parsing fails, create a safe fallback object
        errorData = { message: error.message || "Failed to verify email" };
      }
      
      if (errorData.resetTime) {
        const resetInSeconds = Math.ceil((errorData.resetTime - Date.now()) / 1000);
        setCooldowns(prev => ({ ...prev, emailVerify: resetInSeconds }));
      }
      
      toast({
        title: "Error",
        description: errorData.message || "Failed to verify email",
        variant: "destructive",
      });
    }
  });

  // Verify phone code
  const verifyPhoneCode = useMutation({
    mutationFn: async (token: string): Promise<VerificationResponse> => {
      const response = await apiRequest('POST', '/api/auth/verify-phone', { token });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setPhoneVerificationComplete(true);
        setPhoneCode("");
        toast({
          title: "Phone Verified!",
          description: data.message || "Your phone number has been successfully verified.",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid verification code.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      let errorData = {};
      try {
        errorData = error.message ? JSON.parse(error.message) : {};
      } catch (e) {
        // If JSON parsing fails, create a safe fallback object
        errorData = { message: error.message || "Failed to verify phone" };
      }
      
      if (errorData.resetTime) {
        const resetInSeconds = Math.ceil((errorData.resetTime - Date.now()) / 1000);
        setCooldowns(prev => ({ ...prev, phoneVerify: resetInSeconds }));
      }
      
      toast({
        title: "Error",
        description: errorData.message || "Failed to verify phone",
        variant: "destructive",
      });
    }
  });


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const canSendEmail = cooldowns.email === 0 && !sendEmailVerification.isPending;
  const canSendPhone = cooldowns.phone === 0 && !sendPhoneVerification.isPending;
  const canVerifyEmail = cooldowns.emailVerify === 0 && !verifyEmailCode.isPending;
  const canVerifyPhone = cooldowns.phoneVerify === 0 && !verifyPhoneCode.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-background">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Shield className="h-8 w-8 text-primary mr-2" />
          </div>
          <CardTitle className="text-xl">Security Verification</CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete verification to secure your account
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
                {emailVerificationComplete && <Check className="h-4 w-4 text-green-500" />}
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
                {phoneVerificationComplete && <Check className="h-4 w-4 text-green-500" />}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email Address</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={userEmail || ""} 
                    readOnly 
                    className="bg-muted" 
                    data-testid="input-verification-email"
                  />
                  {emailVerificationComplete ? (
                    <Badge variant="secondary" className="text-green-700 bg-green-100">
                      <Check className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>

              {!emailVerificationComplete && (
                <>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => sendEmailVerification.mutate()}
                      disabled={!canSendEmail}
                      className="w-full"
                      data-testid="button-send-email-verification"
                    >
                      {sendEmailVerification.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </div>
                      ) : cooldowns.email > 0 ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Resend in {formatTime(cooldowns.email)}
                        </div>
                      ) : (
                        `${emailSent ? 'Resend' : 'Send'} Verification Code`
                      )}
                    </Button>
                  </div>

                  {emailSent && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor="emailCode" className="text-sm font-medium">
                          Enter Verification Code
                        </Label>
                        <Input
                          id="emailCode"
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          className="text-center tracking-widest"
                          data-testid="input-email-verification-code"
                        />
                        <Button 
                          onClick={() => verifyEmailCode.mutate(emailCode)}
                          disabled={emailCode.length !== 6 || !canVerifyEmail}
                          className="w-full"
                          data-testid="button-verify-email-code"
                        >
                          {verifyEmailCode.isPending ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              Verifying...
                            </div>
                          ) : cooldowns.emailVerify > 0 ? (
                            `Wait ${formatTime(cooldowns.emailVerify)}`
                          ) : (
                            'Verify Email'
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="phone" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Phone Number</Label>
                {userPhone ? (
                  <div className="flex items-center gap-2">
                    <Input 
                      value={userPhone} 
                      readOnly 
                      className="bg-muted"
                      data-testid="input-verification-phone"
                    />
                    {phoneVerificationComplete ? (
                      <Badge variant="secondary" className="text-green-700 bg-green-100">
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={selectedCountryCode} 
                        onValueChange={setSelectedCountryCode}
                        data-testid="select-country-code"
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {COUNTRY_CODES.map((country, index) => (
                            <SelectItem 
                              key={`${country.code}-${country.country}-${index}`} 
                              value={country.code}
                            >
                              <div className="flex items-center gap-2">
                                <span>{country.flag}</span>
                                <span>{country.code}</span>
                                <span className="text-xs text-muted-foreground">{country.country}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter phone number"
                        className="flex-1"
                        data-testid="input-phone-number"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Enter your phone number with the country code selected above
                    </div>
                  </>
                )}
              </div>

              {!phoneVerificationComplete && (
                <>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => sendPhoneVerification.mutate()}
                      disabled={!canSendPhone || (!userPhone && phoneNumber.length < 8)}
                      className="w-full"
                      data-testid="button-send-phone-verification"
                    >
                      {sendPhoneVerification.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </div>
                      ) : cooldowns.phone > 0 ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Resend in {formatTime(cooldowns.phone)}
                        </div>
                      ) : (
                        `${phoneSent ? 'Resend' : 'Send'} Verification Code`
                      )}
                    </Button>
                  </div>

                  {phoneSent && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor="phoneCode" className="text-sm font-medium">
                          Enter Verification Code
                        </Label>
                        <Input
                          id="phoneCode"
                          value={phoneCode}
                          onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          className="text-center tracking-widest"
                          data-testid="input-phone-verification-code"
                        />
                        <Button 
                          onClick={() => verifyPhoneCode.mutate(phoneCode)}
                          disabled={phoneCode.length !== 6 || !canVerifyPhone}
                          className="w-full"
                          data-testid="button-verify-phone-code"
                        >
                          {verifyPhoneCode.isPending ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              Verifying...
                            </div>
                          ) : cooldowns.phoneVerify > 0 ? (
                            `Wait ${formatTime(cooldowns.phoneVerify)}`
                          ) : (
                            'Verify Phone'
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Verification Status
              </div>
              <div className="flex gap-2">
                <Badge variant={emailVerificationComplete ? "secondary" : "outline"}>
                  <Mail className="h-3 w-3 mr-1" />
                  Email: {emailVerificationComplete ? "Verified" : "Pending"}
                </Badge>
                <Badge variant={phoneVerificationComplete ? "secondary" : "outline"}>
                  <Phone className="h-3 w-3 mr-1" />
                  Phone: {phoneVerificationComplete ? "Verified" : "Pending"}
                </Badge>
              </div>
            </div>
            
            {emailVerificationComplete && phoneVerificationComplete && (
              <div className="mt-4">
                <Button onClick={onComplete} className="w-full" data-testid="button-complete-verification">
                  <Check className="h-4 w-4 mr-2" />
                  Continue to Dashboard
                </Button>
              </div>
            )}

            {(!emailVerificationComplete || !phoneVerificationComplete) && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  className="w-full"
                  data-testid="button-skip-verification"
                >
                  Skip Verification (Not Recommended)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}