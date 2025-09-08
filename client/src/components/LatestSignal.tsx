import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp, Clock, Target, ShieldCheck } from "lucide-react";
import { TradingSignal } from "@/types/trading";

export default function LatestSignal() {
  const { user } = useAuth();

  const { data: latestSignal, isLoading } = useQuery<TradingSignal | null>({
    queryKey: ["/api/v1/signals/latest"],
    enabled: !!user && user.subscriptionTier !== 'free',
  });

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const signalTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - signalTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'BUY' ? 'text-success' : 'text-error';
  };

  const getDirectionBgColor = (direction: string) => {
    return direction === 'BUY' ? 'bg-success/10 border-success/20' : 'bg-error/10 border-error/20';
  };

  if (user?.subscriptionTier === 'free') {
    return (
      <Card className="trading-card" data-testid="card-latest-signal">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-muted-foreground" />
            Latest Signal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted/20 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upgrade Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Latest signals are available for Starter and Pro members only.
            </p>
            <Badge variant="outline" className="text-xs">
              Free Plan
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="trading-card" data-testid="card-latest-signal">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-success" />
            Latest Signal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-12 bg-muted/20 rounded-lg"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-8 bg-muted/20 rounded"></div>
              <div className="h-8 bg-muted/20 rounded"></div>
            </div>
            <div className="h-16 bg-muted/20 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestSignal) {
    return (
      <Card className="trading-card" data-testid="card-latest-signal">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-muted-foreground" />
            Latest Signal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted/20 rounded-full flex items-center justify-center">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Signals Yet</h3>
            <p className="text-sm text-muted-foreground">
              Generate your first AI trading signal using the generator above.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="trading-card" data-testid="card-latest-signal">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-success" />
          Latest Signal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-center justify-between p-3 rounded-lg border ${getDirectionBgColor(latestSignal.direction)}`}>
          <span className={`font-semibold ${getDirectionColor(latestSignal.direction)}`} data-testid="text-signal-direction">
            {latestSignal.pair} {latestSignal.direction}
          </span>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            <span data-testid="text-signal-time">{getTimeAgo(latestSignal.createdAt)}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Entry:</span>
            <div className="font-semibold" data-testid="text-signal-entry">${latestSignal.entryPrice}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Confidence:</span>
            <div className="font-semibold text-success" data-testid="text-signal-confidence">{latestSignal.confidence}%</div>
          </div>
          <div>
            <span className="text-muted-foreground">Stop Loss:</span>
            <div className="font-semibold text-error" data-testid="text-signal-stoploss">${latestSignal.stopLoss}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Take Profit:</span>
            <div className="font-semibold text-success" data-testid="text-signal-takeprofit">${latestSignal.takeProfit}</div>
          </div>
        </div>
        
        {/* Pro Users: Show All 3 Take Profit Levels */}
        {user?.subscriptionTier === 'pro' && latestSignal.takeProfits && latestSignal.takeProfits.length > 1 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-primary">Take Profit Levels:</div>
            <div className="grid grid-cols-1 gap-2">
              {latestSignal.takeProfits.map((tp, index) => (
                <div key={tp.level} className="flex items-center justify-between p-2 bg-success/10 rounded border border-success/20">
                  <span className="text-sm text-muted-foreground">
                    TP{tp.level} ({tp.risk_reward_ratio}R):
                  </span>
                  <span className="text-sm font-semibold text-success" data-testid={`text-tp-level-${tp.level}`}>
                    ${typeof tp.price === 'number' ? tp.price.toFixed(2) : tp.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {latestSignal.analysis && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-sm font-medium text-primary mb-2">AI Analysis:</div>
            <p className="text-xs text-muted-foreground" data-testid="text-signal-analysis">
              {latestSignal.analysis}
            </p>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge 
            variant={latestSignal.status === 'active' || latestSignal.status === 'fresh' ? 'default' : 'secondary'}
            className={latestSignal.status === 'active' ? 'bg-warning text-black' : latestSignal.status === 'fresh' ? 'bg-success text-white' : ''}
            data-testid="badge-signal-status"
          >
            {latestSignal.status === 'active' ? 'Active' : 
             latestSignal.status === 'fresh' ? 'Fresh' :
             latestSignal.status === 'closed' ? 'Closed' : 'Stopped'}
          </Badge>
          
          {latestSignal.pips && (
            <span className={`text-sm font-semibold ${parseFloat(latestSignal.pips) >= 0 ? 'text-success' : 'text-error'}`} data-testid="text-signal-pips">
              {parseFloat(latestSignal.pips) >= 0 ? '+' : ''}{latestSignal.pips} pips
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
