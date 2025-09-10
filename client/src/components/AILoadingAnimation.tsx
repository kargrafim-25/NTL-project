import { Brain, Activity } from 'lucide-react';
import logoUrl from '../assets/logo.png';

interface AILoadingAnimationProps {
  message?: string;
}

export default function AILoadingAnimation({ 
  message = "Analyzing markets with AI..." 
}: AILoadingAnimationProps) {
  return (
    <div 
      className="flex flex-col items-center space-y-4 py-6" 
      data-testid="ai-loading-animation"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* Animated Logo Container */}
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-spin-slow motion-reduce:animate-none">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse motion-reduce:animate-none"></div>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <div className="w-1 h-1 bg-secondary rounded-full animate-pulse delay-500 motion-reduce:animate-none"></div>
            </div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2">
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-1000 motion-reduce:animate-none"></div>
            </div>
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2">
              <div className="w-1 h-1 bg-secondary rounded-full animate-pulse delay-1500 motion-reduce:animate-none"></div>
            </div>
          </div>
        </div>

        {/* Middle pulse ring */}
        <div className="absolute inset-2 rounded-full border border-secondary/50 animate-ping motion-reduce:animate-none"></div>
        
        {/* Logo in center */}
        <div className="absolute inset-4 flex items-center justify-center">
          <img 
            src={logoUrl} 
            alt="Next Trading Labs" 
            className="w-8 h-8 object-contain animate-pulse motion-reduce:animate-none"
            data-testid="loading-logo"
          />
        </div>
      </div>

      {/* Neural Network Pattern */}
      <div className="relative w-32 h-8 overflow-hidden">
        {/* Data flow lines */}
        <div className="absolute inset-0 flex items-center justify-between opacity-60">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="relative">
              {/* Vertical lines representing data streams */}
              <div 
                className="w-px bg-gradient-to-b from-primary via-secondary to-primary animate-pulse motion-reduce:animate-none"
                style={{
                  height: '20px',
                  animationDelay: `${i * 200}ms`,
                  animationDuration: '1.5s'
                }}
              />
              {/* Moving data points */}
              <div 
                className="absolute top-0 w-1 h-1 bg-primary rounded-full animate-bounce motion-reduce:animate-none"
                style={{
                  animationDelay: `${i * 300}ms`,
                  animationDuration: '2s'
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Connecting neural paths */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 128 32">
          <path 
            d="M0 16 Q32 8 64 16 T128 16" 
            stroke="url(#gradient)" 
            strokeWidth="1" 
            fill="none" 
            className="animate-pulse motion-reduce:animate-none"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="var(--secondary)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* AI Brain Activity */}
      <div className="flex items-center space-x-2">
        <Brain className="w-4 h-4 text-primary animate-pulse motion-reduce:animate-none" />
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 bg-secondary rounded-full animate-bounce motion-reduce:animate-none"
              style={{
                animationDelay: `${i * 200}ms`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
        <Activity className="w-4 h-4 text-secondary animate-pulse motion-reduce:animate-none" />
      </div>

      {/* Loading Message */}
      <div className="text-center">
        <p className="text-sm font-medium text-foreground animate-pulse">
          {message}
        </p>
        <div className="flex items-center justify-center mt-2 space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse motion-reduce:animate-none"></div>
          <div className="w-2 h-2 bg-secondary rounded-full animate-pulse delay-100 motion-reduce:animate-none"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200 motion-reduce:animate-none"></div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="w-48 h-1 bg-muted/30 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary via-secondary to-primary animate-pulse motion-reduce:animate-none"></div>
        <div className="h-full w-1/3 bg-gradient-to-r from-primary to-secondary animate-slide-right motion-reduce:animate-none"></div>
      </div>
    </div>
  );
}