import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { History, ShieldCheck, Clock } from "lucide-react";
import { TradingSignal } from "@/types/trading";

export default function SignalHistory() {
  const { user } = useAuth();

  const { data: signals = [], isLoading } = useQuery<TradingSignal[]>({
    queryKey: ["/api/v1/signals"],
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fresh':
      case 'active':
        return 'text-warning';
      case 'closed':
        return 'text-success';
      case 'stopped':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'fresh':
      case 'active':
        return 'bg-warning/5 border-warning/10';
      case 'closed':
        return 'bg-success/5 border-success/10';
      case 'stopped':
        return 'bg-error/5 border-error/10';
      default:
        return 'bg-muted/5 border-muted/10';
    }
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'BUY' ? 'text-success' : 'text-error';
  };

  if (user?.subscriptionTier === 'free') {
    return (
      <Card className="trading-card" data-testid="card-signal-history">
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="mr-2 h-5 w-5 text-muted-foreground" />
            Recent Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted/20 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upgrade Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Signal history is available for Starter and Pro members only.
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
      <Card className="trading-card" data-testid="card-signal-history">
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="mr-2 h-5 w-5 text-primary" />
            Recent Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (signals.length === 0) {
    return (
      <Card className="trading-card" data-testid="card-signal-history">
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="mr-2 h-5 w-5 text-muted-foreground" />
            Recent Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted/20 rounded-full flex items-center justify-center">
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Signals Yet</h3>
            <p className="text-sm text-muted-foreground">
              Your trading signals will appear here once you start generating them.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show only recent signals (last 10)
  const recentSignals = signals.slice(0, 10);

  return (
    <Card className="trading-card" data-testid="card-signal-history">
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="mr-2 h-5 w-5 text-primary" />
          Recent Signals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentSignals.map((signal) => (
            <div 
              key={signal.id} 
              className={`p-3 rounded-lg border ${getStatusBgColor(signal.status)}`}
              data-testid={`signal-item-${signal.id}`}
            >
              {/* Main signal info row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${(signal.status === 'active' || signal.status === 'fresh') ? 'animate-pulse' : ''}`} 
                       style={{ backgroundColor: (signal.status === 'active' || signal.status === 'fresh') ? 'hsl(var(--warning))' : 
                                                 signal.status === 'closed' ? 'hsl(var(--success))' : 
                                                 'hsl(var(--error))' }} />
                  <div>
                    <div className="font-medium">
                      <span className={getDirectionColor(signal.direction)} data-testid={`text-signal-${signal.id}-direction`}>
                        {signal.pair} {signal.direction}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span data-testid={`text-signal-${signal.id}-timeframe`}>{signal.timeframe}</span>
                      <span className="mx-1">•</span>
                      <span data-testid={`text-signal-${signal.id}-time`}>{getTimeAgo(signal.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {signal.pips ? (
                    <div className={`font-semibold ${parseFloat(signal.pips) >= 0 ? 'text-success' : 'text-error'}`} 
                         data-testid={`text-signal-${signal.id}-pips`}>
                      {parseFloat(signal.pips) >= 0 ? '+' : ''}{signal.pips} pips
                    </div>
                  ) : (
                    <div className={`font-semibold ${getStatusColor(signal.status)}`} data-testid={`text-signal-${signal.id}-status`}>
                      {(signal.status === 'active' || signal.status === 'fresh') ? 'Running' : 
                       signal.status === 'closed' ? 'Closed' : 'Stopped'}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Entry: ${signal.entryPrice}
                  </div>
                </div>
              </div>

              {/* Pro Users: Show Take Profit Levels */}
              {user?.subscriptionTier === 'pro' && signal.takeProfits && signal.takeProfits.length > 1 && (
                <div className="mt-3 pt-2 border-t border-border/50">
                  <div className="grid grid-cols-3 gap-2">
                    {signal.takeProfits.map((tp) => (
                      <div key={tp.level} className="text-center p-1 bg-success/5 rounded border border-success/10">
                        <div className="text-xs text-muted-foreground">TP{tp.level}</div>
                        <div className="text-xs font-semibold text-success" data-testid={`text-signal-${signal.id}-tp-${tp.level}`}>
                          ${typeof tp.price === 'number' ? tp.price.toFixed(2) : tp.price}
                        </div>
                        <div className="text-xs text-muted-foreground">{tp.risk_reward_ratio}R</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {signals.length > 10 && (
          <div className="text-center pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {recentSignals.length} of {signals.length} signals
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
