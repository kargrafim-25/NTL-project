import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Users } from "lucide-react";

export default function PremiumFeatures() {
  const handleTelegramAccess = () => {
    // In a real implementation, this would redirect to the Telegram group
    window.open('https://t.me/+nexttradinglab', '_blank');
  };

  const handleMT5EADiscounts = () => {
    // In a real implementation, this would redirect to the EA marketplace
    window.open('/ea-marketplace', '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Telegram Access */}
      <Card className="trading-card" data-testid="card-telegram-access">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Telegram Premium Group
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Join our exclusive Telegram group for real-time signal notifications, market discussions, 
            and direct access to our trading experts.
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-success rounded-full mr-3" />
              Real-time signal alerts
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-success rounded-full mr-3" />
              Market analysis discussions
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-success rounded-full mr-3" />
              Direct expert support
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-success rounded-full mr-3" />
              Pro trading community
            </div>
          </div>
          <Button 
            onClick={handleTelegramAccess}
            className="gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 w-full"
            data-testid="button-join-telegram"
          >
            <Users className="mr-2 h-4 w-4" />
            Join Premium Group
          </Button>
        </CardContent>
      </Card>

      {/* MT5 EA Discounts */}
      <Card className="trading-card" data-testid="card-mt5-ea">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="mr-2 h-5 w-5 text-secondary" />
            MT5 Expert Advisors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Get exclusive discounts on our automated trading MT5 EA and TradingView indicators. 
            Starter: 10% MT5 EA + 20% TradingView indicators, Pro: 40% MT5 EA + 50% TradingView indicators.
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-success rounded-full mr-3" />
              Up to 40% off Expert Advisors
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-success rounded-full mr-3" />
              Up to 50% off TradingView indicators
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-success rounded-full mr-3" />
              Professional backtesting
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-success rounded-full mr-3" />
              24/7 automated trading
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-success rounded-full mr-3" />
              Risk management built-in
            </div>
          </div>
          <Button 
            onClick={handleMT5EADiscounts}
            className="bg-gradient-to-r from-secondary to-accent text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 w-full"
            data-testid="button-browse-ea"
          >
            <Bot className="mr-2 h-4 w-4" />
            Browse Marketplace
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
