import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Brain, Sparkles } from "lucide-react";
import { GenerateSignalRequest, GenerateSignalResponse } from "@/types/trading";

const timeframes = [
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
  const queryClient = useQueryClient();

  const generateSignalMutation = useMutation({
    mutationFn: async (data: GenerateSignalRequest): Promise<GenerateSignalResponse> => {
      const response = await apiRequest('POST', '/api/v1/generate-signal', data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.basicConfirmation) {
        // Handle free user basic confirmation
        toast({
          title: "AI Confirmation",
          description: data.basicConfirmation.message,
        });
      } else {
        // Handle full signal for paid users
        toast({
          title: "Signal Generated!",
          description: `New ${data.signal?.direction} signal created successfully.`,
        });
        
        // Invalidate and refetch relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/v1/signals'] });
        queryClient.invalidateQueries({ queryKey: ['/api/v1/signals/latest'] });
      }
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
          {isFreeUser ? (
            <Button
              onClick={handleGenerateSignal}
              disabled={isGenerating}
              className="w-full gradient-primary text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all duration-300 signal-indicator disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-get-basic-confirmation"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-5 w-5" />
                  Get AI Confirmation
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleGenerateSignal}
              disabled={isGenerating}
              className="w-full gradient-primary text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all duration-300 signal-indicator disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-generate-signal"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-5 w-5" />
                  Generate AI Signal
                </>
              )}
            </Button>
          )}
        </div>

        {/* Free User Message with Upgrade Button */}
        {isFreeUser && (
          <div className="p-4 bg-muted/20 rounded-lg border border-muted/20">
            <div className="text-sm font-medium text-muted-foreground mb-2">Free Plan - Basic AI Confirmation</div>
            <p className="text-xs text-muted-foreground mb-3">
              You receive basic AI confirmation that signals meet quality standards. Upgrade for detailed analysis with entry/exit points, stop losses, and take profits.
            </p>
            <Button
              onClick={handleFreeUpgrade}
              variant="outline"
              size="sm"
              className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              data-testid="button-upgrade-for-details"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade for Detailed Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
