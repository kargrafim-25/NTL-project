import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useDeviceTracking } from "@/hooks/useDeviceFingerprint";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Brain, Sparkles, Clock } from "lucide-react";
import logoUrl from '../assets/logo.png';
import AILoadingAnimation from './AILoadingAnimation';
import { GenerateSignalRequest, GenerateSignalResponse } from "@/types/trading";

const timeframes = [
  { value: '5M', label: '5M' },
  { value: '15M', label: '15M' },
  { value: '30M', label: '30M' },
  { value: '1H', label: '1H' },
  { value: '4H', label: '4H' },
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
];

interface SignalGeneratorProps {
  selectedTimeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
}

export default function SignalGenerator({ selectedTimeframe = '1H', onTimeframeChange }: SignalGeneratorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { trackDeviceAction } = useDeviceTracking();
  const queryClient = useQueryClient();
  const [cooldownEndTime, setCooldownEndTime] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  const generateSignalMutation = useMutation({
    mutationFn: async (data: GenerateSignalRequest): Promise<GenerateSignalResponse> => {
      const response = await apiRequest('POST', '/api/v1/generate-signal', data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.basicConfirmation) {
        // Handle free user basic confirmation (old logic - shouldn't happen anymore)
        toast({
          title: "AI Confirmation",
          description: data.basicConfirmation.message,
        });
      } else {
        // Handle full signal for all users (including free users)
        toast({
          title: "Signal Generated!",
          description: `New ${data.signal?.direction} signal created successfully.`,
        });
      }
      
      // Track signal generation for abuse detection
      trackDeviceAction('signal_generated', {
        timeframe: selectedTimeframe,
        signalDirection: data.signal?.direction || 'unknown',
        userTier: user?.subscriptionTier || 'unknown',
        creditsRemaining: data.creditsRemaining
      });
      
      // Set cooldown from successful response
      if (data.nextGenerationTime) {
        setCooldownEndTime(new Date(data.nextGenerationTime));
      }
      
      // Always invalidate and refetch relevant queries for any successful signal generation
      queryClient.invalidateQueries({ queryKey: ['/api/v1/signals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/signals/latest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      // Parse error response for structured data
      try {
        const errorResponse = JSON.parse(error.message);
        
        // Handle cooldown error with structured data
        if (errorResponse.cooldownRemaining && errorResponse.nextGenerationTime) {
          setCooldownEndTime(new Date(errorResponse.nextGenerationTime));
          toast({
            title: "Cooldown Active",
            description: errorResponse.message || `Please wait ${errorResponse.cooldownRemaining} minute${errorResponse.cooldownRemaining !== 1 ? 's' : ''} before generating another signal.`,
            variant: "destructive",
          });
          return;
        }
        
        // Handle daily limit reached
        if (errorResponse.dailyLimitReached) {
          toast({
            title: "Daily Limit Reached",
            description: errorResponse.message,
            variant: "destructive",
          });
          return;
        }
      } catch (parseError) {
        // Fallback to string matching if JSON parsing fails
        if (error.message.includes('Please wait') && error.message.includes('minute')) {
          const minutesMatch = error.message.match(/wait (\d+) minute/);
          if (minutesMatch) {
            const minutes = parseInt(minutesMatch[1]);
            setCooldownEndTime(new Date(Date.now() + minutes * 60 * 1000));
          }
          toast({
            title: "Cooldown Active",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
      }

      // Handle specific error responses
      if (error.message.includes('upgrade')) {
        toast({
          title: "Upgrade Required",
          description: error.message,
          variant: "destructive",
        });
      } else if (error.message.includes('credit limit')) {
        toast({
          title: "Credit Limit Reached",
          description: error.message,
          variant: "destructive",
        });
      } else if (error.message.includes('Market is currently closed')) {
        toast({
          title: "Market Closed",
          description: "Trading signals are only available during market hours.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate signal. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Initialize cooldown from user data on mount
  useEffect(() => {
    if (user?.lastGenerationTime) {
      const userLimits = getTierLimits(user.subscriptionTier || 'free');
      const lastGen = new Date(user.lastGenerationTime);
      const cooldownEnd = new Date(lastGen.getTime() + (userLimits.cooldownMinutes * 60 * 1000));
      const now = new Date();
      
      if (now < cooldownEnd) {
        setCooldownEndTime(cooldownEnd);
      }
    }
  }, [user?.lastGenerationTime, user?.subscriptionTier]);

  // Countdown timer effect
  useEffect(() => {
    if (!cooldownEndTime) {
      setRemainingTime(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.ceil((cooldownEndTime.getTime() - now.getTime()) / (1000 * 60)));
      setRemainingTime(remaining);
      
      if (remaining <= 0) {
        setCooldownEndTime(null);
        setRemainingTime(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownEndTime]);

  const handleGenerateSignal = () => {
    generateSignalMutation.mutate({ timeframe: selectedTimeframe as '15M' | '30M' | '1H' | '4H' | '1D' | '1W' });
  };

  const handleFreeUpgrade = () => {
    toast({
      title: "Upgrade to Access Signals",
      description: "Free users get basic AI confirmation only. Upgrade for full signal access.",
      variant: "destructive",
    });
  };

  const isGenerating = generateSignalMutation.isPending;
  const isFreeUser = user?.subscriptionTier === 'free';
  const isOnCooldown = remainingTime > 0;
  
  // Get tier-specific daily limits
  const getTierLimits = (tier: string) => {
    const limits = {
      free: { dailyLimit: 2, cooldownMinutes: 90 },
      starter: { dailyLimit: 8, cooldownMinutes: 30 },
      pro: { dailyLimit: 20, cooldownMinutes: 15 }
    };
    return limits[tier as keyof typeof limits] || limits.free;
  };
  
  const userLimits = getTierLimits(user?.subscriptionTier || 'free');
  const creditsRemaining = userLimits.dailyLimit - (user?.dailyCredits || 0);

  return (
    <Card className="trading-card" data-testid="card-signal-generator">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5 text-primary" />
          AI Signal Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeframe Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">Select Timeframe</label>
          <div className="grid grid-cols-3 gap-2">
            {timeframes.map((timeframe) => (
              <Button
                key={timeframe.value}
                variant={selectedTimeframe === timeframe.value ? "default" : "outline"}
                size="sm"
                onClick={() => onTimeframeChange?.(timeframe.value)}
                className={`${
                  selectedTimeframe === timeframe.value
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-primary hover:text-primary-foreground'
                } transition-colors`}
                data-testid={`button-timeframe-${timeframe.value}`}
              >
                {timeframe.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div>
          <Button
            onClick={handleGenerateSignal}
            disabled={isGenerating || isOnCooldown || creditsRemaining <= 0}
            className="w-full gradient-primary text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all duration-300 signal-indicator disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid={`button-${isFreeUser ? 'get-basic-confirmation' : 'generate-signal'}`}
            aria-busy={isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analyzing...
              </>
            ) : isOnCooldown ? (
              <>
                <Clock className="mr-2 h-5 w-5" />
                Cooldown: {remainingTime}m remaining
              </>
            ) : creditsRemaining <= 0 ? (
              <>
                <Brain className="mr-2 h-5 w-5 opacity-50" />
                Daily limit reached
              </>
            ) : (
              <>
                <img src={logoUrl} alt="Logo" className="mr-2 h-5 w-5 object-contain" />
                <Brain className="mr-1 h-5 w-5" />
                {isFreeUser ? 'Get AI Confirmation' : 'Generate AI Signal'}
              </>
            )}
          </Button>
          
          {/* Cooldown and Credits Info */}
          <div className="mt-4 space-y-2">
            {isOnCooldown && (
              <div className="flex items-center justify-center text-sm text-muted-foreground" data-testid="cooldown-status">
                <Clock className="mr-1 h-4 w-4" />
                Next signal available in {remainingTime} minute{remainingTime !== 1 ? 's' : ''}
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Credits remaining today:</span>
              <span className="font-medium" data-testid="credits-remaining">
                {creditsRemaining}/{userLimits.dailyLimit}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Cooldown period:</span>
              <span className="font-medium">
                {userLimits.cooldownMinutes} minutes
              </span>
            </div>
          </div>
          
          {/* Full-screen AI Loading Animation */}
          {isGenerating && <AILoadingAnimation />}
        </div>

        {/* Subscription Info */}
        <div className="p-4 bg-muted/20 rounded-lg border border-muted/20">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            {user?.subscriptionTier === 'free' && 'Free Plan'}
            {user?.subscriptionTier === 'starter' && 'Starter Plan'}  
            {user?.subscriptionTier === 'pro' && 'Pro Plan'}
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {user?.subscriptionTier === 'free' && `${userLimits.dailyLimit} signals per day, ${userLimits.cooldownMinutes} minute cooldown. Upgrade to Starter for 8 signals per day with 30 minute cooldown.`}
            {user?.subscriptionTier === 'starter' && `${userLimits.dailyLimit} signals per day, ${userLimits.cooldownMinutes} minute cooldown. Upgrade to Pro for 20 signals per day with 15 minute cooldown.`}
            {user?.subscriptionTier === 'pro' && `${userLimits.dailyLimit} signals per day, ${userLimits.cooldownMinutes} minute cooldown. You have the highest tier!`}
          </p>
          {user?.subscriptionTier !== 'pro' && (
            <Button
              onClick={handleFreeUpgrade}
              variant="outline"
              size="sm"
              className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              data-testid="button-upgrade-for-details"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade {user?.subscriptionTier === 'free' ? 'to Starter' : 'to Pro'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
