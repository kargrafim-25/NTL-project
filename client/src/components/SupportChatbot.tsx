import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, X, Bot, User } from "lucide-react";

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
  pricing: "We offer 3 plans: Free (basic AI confirmation), Starter Trader ($29/month - 50 daily signals), and Pro Trader ($79/month - unlimited signals + Telegram access). All plans include AI-powered market analysis.",
  signals: "Our AI generates real-time XAUUSD trading signals with entry points, stop losses, and take profit levels. Signals include technical analysis and confidence ratings to help you make informed decisions.",
  timeframes: "You can generate signals for multiple timeframes: 5M, 15M, 30M, 1H, 4H, 1D, and 1W. Different timeframes suit different trading strategies from scalping to swing trading.",
  accuracy: "Our signals include confidence ratings from 60-100%. We provide transparent performance tracking, but remember that trading involves risk and past performance doesn't guarantee future results.",
  support: "For technical issues, billing questions, or account help, you can contact our support team. Pro users also get access to our exclusive Telegram group for real-time discussions.",
  subscription: "You can upgrade your plan anytime from your dashboard. Starter plan includes detailed analysis and signal history. Pro plan adds unlimited signals and Telegram community access.",
  risk: "Trading involves substantial risk of loss. Our signals are for educational purposes and market analysis. Always use proper risk management and never invest more than you can afford to lose.",
  market_hours: "We generate signals during market hours (Sunday 10PM - Friday 9PM Casablanca time). Our AI monitors markets 24/7 during trading sessions to provide timely opportunities."
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
    
    // Check for specific keywords and return appropriate responses
    if (input.includes('price') || input.includes('cost') || input.includes('plan') || input.includes('subscription')) {
      return FAQ_RESPONSES.pricing;
    }
    if (input.includes('signal') || input.includes('trade') || input.includes('analysis')) {
      return FAQ_RESPONSES.signals;
    }
    if (input.includes('timeframe') || input.includes('5m') || input.includes('1h') || input.includes('chart')) {
      return FAQ_RESPONSES.timeframes;
    }
    if (input.includes('accuracy') || input.includes('success') || input.includes('performance') || input.includes('confident')) {
      return FAQ_RESPONSES.accuracy;
    }
    if (input.includes('support') || input.includes('help') || input.includes('contact') || input.includes('problem')) {
      return FAQ_RESPONSES.support;
    }
    if (input.includes('upgrade') || input.includes('starter') || input.includes('pro') || input.includes('premium')) {
      return FAQ_RESPONSES.subscription;
    }
    if (input.includes('risk') || input.includes('safe') || input.includes('guarantee') || input.includes('loss')) {
      return FAQ_RESPONSES.risk;
    }
    if (input.includes('hours') || input.includes('time') || input.includes('when') || input.includes('schedule')) {
      return FAQ_RESPONSES.market_hours;
    }
    
    // Default response for unmatched queries
    return "I can help you with questions about our trading signals, pricing plans, timeframes, risk management, and platform features. Could you please be more specific about what you'd like to know?";
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

    // Simulate typing delay
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
    <div className="fixed bottom-4 right-4 z-50 w-80 h-96 max-h-[80vh]">
      <Card className="h-full flex flex-col shadow-xl border-primary/20">
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
        
        <CardContent className="flex-1 flex flex-col p-4 pt-2 space-y-3">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[85%] ${message.isBot ? 'order-2' : ''}`}>
                  <div
                    className={`px-3 py-2 rounded-lg text-sm ${
                      message.isBot
                        ? 'bg-muted text-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {message.content}
                  </div>
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
  );
}