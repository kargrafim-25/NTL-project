import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, X, Bot, User, Mail } from "lucide-react";
import ContactForm from "./ContactForm";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQ_RESPONSES = {
  pricing: "We offer 3 plans:\n\n• Free: 2 signals/day, 10/month\n• Starter Trader ($29/month): Unlimited daily signals, 60/month, Telegram access, 10% MT5 EA discount, 20% TradingView indicators discount, free first month\n• Pro Trader ($79/month): Unlimited signals, Telegram access, 40% MT5 EA discount, 50% TradingView indicators discount, free first month",
  signals: "Our AI-powered platform generates real-time XAUUSD (Gold) trading signals using Next Trading Labs AI technology. Each signal includes:\n\n• Entry price and direction (BUY/SELL)\n• Stop Loss and Take Profit levels\n• Technical analysis reasoning\n• Confidence rating (60-100%)\n• Risk/reward ratio\n\nSignals are generated only during market hours with real market data - no mock or placeholder information.",
  timeframes: "Available timeframes for signal generation:\n\n• 5M - Scalping (very short-term)\n• 15M - Day trading\n• 30M - Intraday trading\n• 1H - Short-term swing\n• 4H - Medium-term swing\n• 1D - Daily analysis\n• 1W - Weekly trends\n\nChoose timeframes that match your trading style and availability.",
  accuracy: "Our signals include confidence ratings from 60-100% based on technical analysis. We provide transparent performance tracking, but remember:\n\n• Trading involves substantial risk\n• Past performance doesn't guarantee future results\n• Always use proper risk management\n• Never invest more than you can afford to lose",
  support: "Need help? I can answer most questions about our platform. For complex issues, use our contact form and we'll get back to you quickly. Pro users also get access to our exclusive Telegram group for real-time discussions with trading experts.",
  subscription: "Plan upgrades:\n\n• Starter Trader: Unlimited daily signals, 60/month limit, Telegram group access, MT5 EA discounts, TradingView indicators discounts, free first month\n• Pro Trader: Unlimited signals (no monthly limit), enhanced Telegram access, higher MT5 EA discounts (40% vs 10%), higher TradingView indicators discounts (50% vs 20%), free first month\n\nUpgrade anytime from your dashboard!",
  risk: "⚠️ Important Risk Disclosure:\n\nTrading involves substantial risk of loss. Our signals are for educational purposes and market analysis. Key points:\n\n• Use proper risk management (stop losses)\n• Never risk more than you can afford to lose\n• Diversify your trading portfolio\n• Our signals are analysis tools, not guaranteed profits\n• Consider your experience level before trading",
  market_hours: "Market Hours (Casablanca timezone):\n• Open: Sunday 10:00 PM\n• Close: Friday 9:00 PM\n\nSignals are generated only during active trading hours. Our AI monitors real-time market data 24/7 during sessions to provide timely opportunities.",
  features: "Next Trading Labs features:\n\n• AI-powered XAUUSD signals using our proprietary technology\n• Real-time TradingView chart integration\n• Economic news tracking (high-impact USD events)\n• Multiple timeframe analysis\n• Performance tracking and history\n• Mobile-responsive design\n• Telegram group access (paid plans)\n• MT5 EA marketplace discounts",
  technology: "Our Technology Stack:\n\n• Next Trading Labs AI for signal generation\n• Real-time market data (no synthetic data)\n• TradingView charts integration\n• Secure user authentication\n• PostgreSQL database for reliability\n• Mobile-optimized interface\n• Economic calendar integration",
  contact_form: "I'd be happy to help you get in touch with our team! Let me show you how to send us a detailed message for personalized support."
};

const GREETING_MESSAGES = [
  "Hi! I'm here to help you with Next Trading Labs. What would you like to know?",
  "Hello! I can answer questions about our trading signals, pricing, and features. How can I assist you?",
  "Welcome! I'm your support assistant. Feel free to ask about our AI trading platform."
];

export default function SupportChatbot({ isOpen, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add greeting message when chatbot opens
      const greetingMessage: Message = {
        id: Date.now().toString(),
        content: GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)],
        isBot: true,
        timestamp: new Date()
      };
      setMessages([greetingMessage]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const findBestResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Contact and support queries
    if (input.includes('contact') || input.includes('email') || input.includes('reach') || input.includes('get in touch')) {
      return FAQ_RESPONSES.contact_form;
    }
    
    // Pricing and subscription queries
    if (input.includes('price') || input.includes('cost') || input.includes('plan') || input.includes('subscription') || input.includes('fee')) {
      return FAQ_RESPONSES.pricing;
    }
    
    // Signal-related queries
    if (input.includes('signal') || input.includes('trade') || input.includes('analysis') || input.includes('ai') || input.includes('algorithm')) {
      return FAQ_RESPONSES.signals;
    }
    
    // Timeframe queries
    if (input.includes('timeframe') || input.includes('5m') || input.includes('15m') || input.includes('1h') || input.includes('4h') || input.includes('chart') || input.includes('scalping') || input.includes('swing')) {
      return FAQ_RESPONSES.timeframes;
    }
    
    // Performance and accuracy queries
    if (input.includes('accuracy') || input.includes('success') || input.includes('performance') || input.includes('confident') || input.includes('win rate') || input.includes('profitable')) {
      return FAQ_RESPONSES.accuracy;
    }
    
    // Support queries
    if (input.includes('support') || input.includes('help') || input.includes('problem') || input.includes('issue') || input.includes('bug') || input.includes('error')) {
      return FAQ_RESPONSES.support;
    }
    
    // Upgrade and tier queries
    if (input.includes('upgrade') || input.includes('starter') || input.includes('pro') || input.includes('premium') || input.includes('telegram') || input.includes('mt5') || input.includes('ea') || input.includes('discount')) {
      return FAQ_RESPONSES.subscription;
    }
    
    // Risk and safety queries
    if (input.includes('risk') || input.includes('safe') || input.includes('guarantee') || input.includes('loss') || input.includes('dangerous') || input.includes('money back')) {
      return FAQ_RESPONSES.risk;
    }
    
    // Market hours queries
    if (input.includes('hours') || input.includes('time') || input.includes('when') || input.includes('schedule') || input.includes('open') || input.includes('close') || input.includes('market')) {
      return FAQ_RESPONSES.market_hours;
    }
    
    // Technology and features queries
    if (input.includes('technology') || input.includes('feature') || input.includes('how it works') || input.includes('platform') || input.includes('app') || input.includes('tradingview') || input.includes('chart')) {
      return FAQ_RESPONSES.features;
    }
    
    // Technical queries
    if (input.includes('database') || input.includes('security') || input.includes('mobile') || input.includes('real-time') || input.includes('technology')) {
      return FAQ_RESPONSES.technology;
    }
    
    // XAUUSD and Gold specific queries
    if (input.includes('xauusd') || input.includes('gold') || input.includes('precious metal') || input.includes('commodity')) {
      return "We specialize in XAUUSD (Gold vs USD) trading signals. Gold is a popular trading instrument due to its volatility and liquidity. Our AI analyzes economic factors, technical indicators, and market sentiment to generate high-quality Gold trading opportunities.\n\nKey benefits of trading Gold:\n• High liquidity and volatility\n• Hedge against inflation\n• Responds to USD economic events\n• 24/5 trading during market hours";
    }
    
    // Economic news queries
    if (input.includes('news') || input.includes('economic') || input.includes('calendar') || input.includes('events') || input.includes('fed') || input.includes('nfp') || input.includes('cpi')) {
      return "Our platform includes an Economic News section that tracks high-impact USD events affecting Gold prices:\n\n• Federal Reserve decisions\n• Non-Farm Payrolls (NFP)\n• Consumer Price Index (CPI)\n• GDP releases\n• Fed Chair speeches\n\nWe display upcoming events with forecasts and recent events with actual vs expected results. This helps you understand market-moving events that could impact your XAUUSD trades.";
    }
    
    // Greeting responses
    if (input.includes('hello') || input.includes('hi') || input.includes('hey') || input === 'help') {
      return "Hello! I'm here to help you with Next Trading Labs. I can answer questions about:\n\n• Pricing plans and subscriptions\n• How our AI trading signals work\n• Timeframes and trading strategies\n• Platform features and technology\n• Risk management and safety\n• Account and technical support\n\nWhat would you like to know?";
    }
    
    // Default response for unmatched queries
    return "I can help with questions about our AI trading platform, pricing plans, signal generation, timeframes, risk management, and technical support. Could you ask about something specific, or would you like me to connect you with our support team for personalized assistance?";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Check if user wants contact form
    const input = userMessage.content.toLowerCase();
    if (input.includes('contact') || input.includes('email') || input.includes('reach') || input.includes('get in touch')) {
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: findBestResponse(userMessage.content),
          isBot: true,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
        
        // Show contact form button after response
        setTimeout(() => {
          const contactMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: "SHOW_CONTACT_FORM",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, contactMessage]);
        }, 500);
      }, 1000);
      return;
    }

    // Simulate typing delay for regular responses
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: findBestResponse(userMessage.content),
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // 1-2 second delay
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <ContactForm 
        isOpen={showContactForm} 
        onClose={() => {
          setShowContactForm(false);
          onClose();
        }}
        onBack={() => setShowContactForm(false)}
      />
      
      {!showContactForm && (
        <div className="fixed bottom-4 right-4 z-50 w-80 h-96 max-h-[80vh]">
          <Card className="h-full flex flex-col shadow-xl border-primary/20 overflow-hidden">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm">Support Assistant</CardTitle>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              data-testid="button-close-chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-4 pt-2 space-y-3 min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0 max-h-full">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[85%] ${message.isBot ? 'order-2' : ''}`}>
                  {message.content === "SHOW_CONTACT_FORM" ? (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm mb-3">Need personalized help? Send us a detailed message:</p>
                      <Button
                        onClick={() => setShowContactForm(true)}
                        className="w-full text-sm"
                        data-testid="button-open-contact-form"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Open Contact Form
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={`px-3 py-2 rounded-lg text-sm break-words whitespace-pre-wrap ${
                        message.isBot
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      {message.content}
                    </div>
                  )}
                  <div className={`text-xs text-muted-foreground mt-1 ${message.isBot ? '' : 'text-right'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {message.isBot && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center order-1 mr-2 mt-1 flex-shrink-0">
                    <Bot className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                {!message.isBot && (
                  <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                    <User className="h-3 w-3 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Bot className="h-3 w-3 text-primary-foreground" />
                </div>
                <div className="bg-muted px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 text-sm"
              disabled={isTyping}
              data-testid="input-chat-message"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              size="sm"
              className="px-3"
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-1">
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => setInputValue("What are your pricing plans?")}
              data-testid="quick-action-pricing"
            >
              Pricing
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => setInputValue("How do trading signals work?")}
              data-testid="quick-action-signals"
            >
              Signals
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => setInputValue("What timeframes are available?")}
              data-testid="quick-action-timeframes"
            >
              Timeframes
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
      )}
    </>
  );
}