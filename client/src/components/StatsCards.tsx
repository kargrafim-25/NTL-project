import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Zap, TrendingUp, BarChart3, Crown } from "lucide-react";
import { User, TradingSignal } from "@/types/trading";

export default function StatsCards() {
  const { user } = useAuth();

  const { data: signals = [] } = useQuery<TradingSignal[]>({
    queryKey: ["/api/v1/signals"],
    enabled: !!user && user.subscriptionTier !== 'free',
  });

  const getCreditsDisplay = () => {
    if (!user) return { used: 0, total: 'N/A' };
    if (user.subscriptionTier === 'pro') return { used: user.dailyCredits, total: 'Unlimited' };
    return { used: user.dailyCredits, total: user.maxDailyCredits };
  };

  const getProgressPercentage = () => {
    if (!user || user.subscriptionTier === 'pro') return 85;
    return Math.min(100, (user.dailyCredits / user.maxDailyCredits) * 100);
  };

  const getSuccessRate = () => {
    if (!signals.length) return '0.0';
    
    // Only count trades that user actually took (not 'pending' or 'didnt_take')
    const takenTrades = signals.filter((s: any) => 
      s.status === 'closed' && 
      s.userAction && 
      ['successful', 'unsuccessful'].includes(s.userAction)
    );
    
    if (!takenTrades.length) return '0.0';
    
    // Count successful trades
    const successfulTrades = takenTrades.filter((s: any) => s.userAction === 'successful');
    return ((successfulTrades.length / takenTrades.length) * 100).toFixed(1);
  };

  const getTodaySignalsCount = () => {
    if (!signals.length) return 0;
    const today = new Date().toDateString();
    return signals.filter((s: any) => new Date(s.createdAt).toDateString() === today).length;
  };

  const getAccountFeatures = () => {
    if (!user) return [];
    const features = [];
    
    if (user.subscriptionTier === 'pro') {
      features.push({ icon: '🔗', text: 'Telegram Access' });
      features.push({ icon: '🤖', text: 'MT5 EA Discounts' });
    } else if (user.subscriptionTier === 'starter') {
      features.push({ icon: '📊', text: 'Signal History' });
    }
    
    return features;
  };

  const credits = getCreditsDisplay();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Credit Usage with Plan Display */}
      <Card className="trading-card" data-testid="card-credits">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Daily Credits</h3>
            <Zap className="h-4 w-4 text-warning" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold" data-testid="text-credits-used">{credits.used}</span>
            <span className="text-muted-foreground">/ {credits.total}</span>
          </div>
          <div className="mt-3 bg-muted/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${getProgressPercentage()}%` }}
              data-testid="progress-credits"
            />
          </div>
          {/* Plan Display */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Plan:</span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              user?.subscriptionTier === 'pro' ? 'bg-gradient-to-r from-secondary to-accent text-white' :
              user?.subscriptionTier === 'starter' ? 'bg-primary text-primary-foreground' :
              'bg-muted text-muted-foreground'
            }`} data-testid="text-plan-badge">
              {user?.subscriptionTier === 'pro' ? 'Pro Trader' : 
               user?.subscriptionTier === 'starter' ? 'Starter Trader' : 'Free User'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card className="trading-card" data-testid="card-success-rate">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Success Rate</h3>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-success" data-testid="text-success-rate">
              {getSuccessRate()}%
            </span>
            <span className="text-success text-sm">↑ 2.1%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
        </CardContent>
      </Card>

      {/* Total Signals */}
      <Card className="trading-card" data-testid="card-signals-today">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Signals Today</h3>
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold" data-testid="text-signals-count">{getTodaySignalsCount()}</span>
            <span className="text-muted-foreground">generated</span>
          </div>
          <p className="text-xs text-success mt-1">Active tracking</p>
        </CardContent>
      </Card>

    </div>
  );
}
