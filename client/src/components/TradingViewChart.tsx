import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TradingViewChartProps {
  selectedTimeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
}

// Convert our timeframe format to TradingView chart intervals
const getChartInterval = (timeframe: string) => {
  switch (timeframe) {
    case '5M': return '5';
    case '15M': return '15';
    case '30M': return '30';
    case '1H': return '60';
    case '4H': return '240';
    case '1D': return 'D';
    case '1W': return 'W';
    default: return '60';
  }
};

export default function TradingViewChart({ selectedTimeframe = '1H', onTimeframeChange }: TradingViewChartProps) {
  const [activeTimeframe, setActiveTimeframe] = useState(selectedTimeframe);

  // Sync with external timeframe changes
  useEffect(() => {
    setActiveTimeframe(selectedTimeframe);
  }, [selectedTimeframe]);

  // Generate dynamic iframe URL based on active timeframe
  const getTradingViewUrl = () => {
    const interval = getChartInterval(activeTimeframe);
    return `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=XAUUSD&interval=${interval}&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=1&saveimage=1&toolbarbg=rgba(30,30,30,1)&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=XAUUSD`;
  };
  return (
    <Card className="chart-container" data-testid="card-trading-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Live Chart
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Live Chart</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* TradingView Embedded Chart */}
        <div className="h-96 rounded-lg overflow-hidden border border-border/50">
          <iframe
            key={activeTimeframe} // Force re-render when timeframe changes
            src={getTradingViewUrl()}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            allowFullScreen={true}
            data-testid="tradingview-chart"
            className="rounded-lg"
          ></iframe>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Timeframe:</span>
            <div className="flex space-x-1">
              {['5M', '15M', '30M', '1H', '4H', '1D', '1W'].map((tf) => (
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
