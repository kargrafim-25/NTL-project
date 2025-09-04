import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TradingViewChartProps {
  selectedTimeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
}

export default function TradingViewChart({ selectedTimeframe = '1H', onTimeframeChange }: TradingViewChartProps) {
  const [activeTimeframe, setActiveTimeframe] = useState(selectedTimeframe);
  return (
    <Card className="chart-container" data-testid="card-trading-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Live Chart
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold" data-testid="text-current-price">$2,045.60</span>
            <span className="text-success text-sm" data-testid="text-price-change">↑ +0.12%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* TradingView Chart Integration */}
        <div className="h-96 bg-muted/5 rounded-lg flex items-center justify-center border border-border/50 relative overflow-hidden">
          {/* Chart Placeholder - In production, integrate TradingView widget */}
          <div className="text-center z-10">
            <BarChart3 className="h-16 w-16 text-primary mb-4 mx-auto" />
            <p className="text-muted-foreground font-medium">TradingView Chart Integration</p>
            <p className="text-sm text-muted-foreground mt-2">Real-time XAUUSD price data</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => window.open('https://www.tradingview.com/chart/?symbol=XAUUSD', '_blank')}
              data-testid="button-open-tradingview"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in TradingView
            </Button>
          </div>
          
          {/* Animated Background Grid */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 300">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Animated price line */}
              <polyline
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                points="50,150 100,120 150,140 200,100 250,130 300,90 350,110"
                className="animate-pulse-slow"
              />
            </svg>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Timeframe:</span>
            <div className="flex space-x-1">
              {['15M', '30M', '1H', '4H', '1D', '1W'].map((tf) => (
                <Button
                  key={tf}
                  variant={tf === activeTimeframe ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setActiveTimeframe(tf);
                    onTimeframeChange?.(tf);
                  }}
                  data-testid={`button-chart-timeframe-${tf}`}
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
