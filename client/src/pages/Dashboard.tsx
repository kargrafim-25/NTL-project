import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMarketStatus } from "@/hooks/useMarketStatus";
import StatsCards from "@/components/StatsCards";
import SignalGenerator from "@/components/SignalGenerator";
import LatestSignal from "@/components/LatestSignal";
import TradingViewChart from "@/components/TradingViewChart";
import SignalHistory from "@/components/SignalHistory";
import PremiumFeatures from "@/components/PremiumFeatures";
import { EconomicNews } from "@/components/EconomicNews";
import { TrendingUp, LogOut, Database } from "lucide-react";
import logoUrl from '../assets/logo.png';
import ChatbotTrigger from '@/components/ChatbotTrigger';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isOpen: isMarketOpen, isLoading: isMarketLoading } = useMarketStatus();
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1H');

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'bg-gradient-to-r from-secondary to-accent text-white';
      case 'starter':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSubscriptionLabel = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'Pro Trader';
      case 'starter':
        return 'Starter Trader';
      default:
        return 'Free User';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 gradient-primary rounded-full animate-spin mb-4 flex items-center justify-center">
            <TrendingUp className="text-white text-2xl animate-bounce-gentle" />
          </div>
          <p className="text-lg font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img 
                src={logoUrl} 
                alt="Next Trading Labs Logo" 
                className="w-10 h-10 object-contain rounded-lg"
                data-testid="img-logo"
              />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Next Trading Labs
                </h1>
                <p className="text-xs text-muted-foreground">AI-Powered Trading Signals</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Market Status */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                isMarketLoading 
                  ? 'bg-muted/20' 
                  : isMarketOpen 
                    ? 'bg-success/20' 
                    : 'bg-destructive/20'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isMarketLoading
                    ? 'bg-muted animate-pulse'
                    : isMarketOpen 
                      ? 'bg-success animate-pulse' 
                      : 'bg-destructive'
                }`} data-testid="status-market"></div>
                <span className={`text-sm font-medium ${
                  isMarketLoading
                    ? 'text-muted-foreground'
                    : isMarketOpen 
                      ? 'text-success' 
                      : 'text-destructive'
                }`}>
                  {isMarketLoading ? 'Checking...' : isMarketOpen ? 'Market Open' : 'Market Closed'}
                </span>
              </div>
              
              {/* User Plan Badge */}
              {user && (
                <Badge 
                  className={`px-4 py-2 rounded-full font-semibold text-sm ${getSubscriptionBadgeColor(user.subscriptionTier)}`}
                  data-testid="badge-subscription"
                >
                  {getSubscriptionLabel(user.subscriptionTier)}
                </Badge>
              )}

              {/* Admin Logs Button */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/admin/logs'}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-admin-logs"
                title="View API Logs"
              >
                <Database className="h-4 w-4" />
              </Button>

              {/* Logout Button */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Stats Bar */}
        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Signal Generation Panel */}
          <div className="lg:col-span-1">
            <SignalGenerator 
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
            />
            <div className="mt-6">
              <LatestSignal />
            </div>
            <div className="mt-6">
              <EconomicNews />
            </div>
          </div>

          {/* Chart and Analysis */}
          <div className="lg:col-span-2">
            <TradingViewChart 
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
            />
            <div className="mt-6">
              <SignalHistory />
            </div>
          </div>
        </div>

        {/* Premium Features */}
        {user && user.subscriptionTier === 'pro' && (
          <div className="mt-8">
            <PremiumFeatures />
          </div>
        )}
      </div>
      
      {/* Support Chatbot */}
      <ChatbotTrigger />
    </div>
  );
}
