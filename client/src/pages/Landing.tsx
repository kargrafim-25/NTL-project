import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shield, Zap, Users, Crown, Bot } from "lucide-react";
import logoUrl from '../assets/logo.png';
import ChatbotTrigger from '@/components/ChatbotTrigger';

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

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
            
            <Button 
              onClick={handleLogin}
              className="gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
              data-testid="button-login"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/20" data-testid="badge-status">
              AI-Powered Trading Platform
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
              Professional AI Trading Signals
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Get real-time AI-generated trading signals with advanced analysis, 
              risk management, and professional-grade insights powered by cutting-edge technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={handleLogin}
                className="gradient-primary text-white font-semibold text-lg px-8 py-4 hover:shadow-lg hover:scale-105 transition-all duration-300 signal-indicator"
                data-testid="button-get-started"
              >
                <Zap className="mr-2 h-5 w-5" />
                Start Trading Now
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-4 border-primary/20 hover:bg-primary/10"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Next Trading Labs?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced AI technology meets professional trading expertise to deliver 
              superior market insights and trading opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="trading-card" data-testid="card-ai-signals">
              <CardHeader>
                <div className="w-12 h-12 bg-white/90 border border-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <img src={logoUrl} alt="Logo" className="h-6 w-6 object-contain" />
                </div>
                <CardTitle>AI-Powered Signals</CardTitle>
                <CardDescription>
                  Advanced machine learning algorithms analyze market data in real-time to generate high-confidence trading signals.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="trading-card" data-testid="card-risk-management">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-success to-success/80 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Risk Management</CardTitle>
                <CardDescription>
                  Every signal includes precise stop-loss and take-profit levels, ensuring proper risk management for all trades.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="trading-card" data-testid="card-real-time">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning/80 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Real-Time Analysis</CardTitle>
                <CardDescription>
                  Get instant market analysis with live price feeds and immediate signal generation during market hours.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Trading Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade as your trading needs grow. All plans include our core AI signal technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <Card className="trading-card relative bg-muted/20 border-muted" data-testid="card-plan-free">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-muted-foreground">Free</CardTitle>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">Basic</Badge>
                </div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3" />
                    2 signals per day
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3" />
                    10 signals per month
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3" />
                    Basic AI confirmation
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3" />
                    Market status updates
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6 border-muted text-muted-foreground hover:bg-muted/20"
                  variant="outline"
                  onClick={handleLogin}
                  data-testid="button-select-free"
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Starter Tier */}
            <Card className="trading-card relative border-primary" data-testid="card-plan-starter">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Starter Trader</CardTitle>
                  <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                </div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3" />
                    Unlimited signals per day
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3" />
                    60 signals per month
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3" />
                    Access to Telegram group
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3" />
                    10% discount on MT5 EA
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3" />
                    20% discount on TradingView indicators
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3" />
                    Free first month
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6 gradient-primary text-white"
                  onClick={handleLogin}
                  data-testid="button-select-starter"
                >
                  Choose Starter
                </Button>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="trading-card relative" data-testid="card-plan-pro">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Pro Trader</CardTitle>
                  <Crown className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">$79</span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3" />
                    Unlimited signals
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3" />
                    <Users className="h-4 w-4 mr-1 text-primary" />
                    Access to Telegram group
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3" />
                    <Bot className="h-4 w-4 mr-1 text-secondary" />
                    40% discount on MT5 EA
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3" />
                    50% discount on TradingView indicators
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3" />
                    Free first month
                  </li>
                </ul>
                <Button 
                  className="w-full mt-6 bg-gradient-to-r from-secondary to-accent text-white"
                  onClick={handleLogin}
                  data-testid="button-select-pro"
                >
                  Choose Pro
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center space-x-4 mb-8">
            <img 
              src={logoUrl} 
              alt="Next Trading Labs Logo" 
              className="w-8 h-8 object-contain rounded-lg"
              data-testid="img-logo-footer"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Next Trading Labs
            </span>
          </div>
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 Next Trading Labs. Professional AI-powered trading signals for XAUUSD.</p>
            <p className="mt-2 text-sm">Risk Warning: Trading involves substantial risk of loss.</p>
          </div>
        </div>
      </footer>
      
      {/* Support Chatbot */}
      <ChatbotTrigger />
    </div>
  );
}
