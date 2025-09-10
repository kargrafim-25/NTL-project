import { Brain, Activity, TrendingUp, Zap, Target, BarChart3 } from 'lucide-react';
import logoUrl from '../assets/logo.png';
import { useState, useEffect } from 'react';

interface AILoadingAnimationProps {
  message?: string;
}

const loadingPhrases = [
  "Analyzing market data...",
  "Processing technical indicators...",
  "Evaluating market sentiment...",
  "Computing risk parameters...",
  "Generating trading insights...",
  "Optimizing entry points...",
  "Calculating stop losses...",
  "Finalizing signal analysis..."
];

export default function AILoadingAnimation({ 
  message = "Analyzing markets with AI..." 
}: AILoadingAnimationProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const phraseInterval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
        setIsVisible(true);
      }, 300);
    }, 2000);

    return () => clearInterval(phraseInterval);
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-background/95 backdrop-blur-lg flex items-center justify-center z-50" 
      data-testid="ai-loading-animation"
      role="status"
      aria-live="polite"
      aria-label={loadingPhrases[currentPhraseIndex]}
    >
      <div className="relative flex flex-col items-center space-y-8 p-8">
        {/* Animated Logo Container - Much Larger */}
        <div className="relative w-32 h-32">
          {/* Outer rotating ring with orbital particles */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/40 animate-spin motion-reduce:animate-none" style={{animationDuration: '4s'}}>
            {/* Moving orbital particles */}
            {[...Array(8)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-3 h-3 -top-1.5 left-1/2 transform -translate-x-1/2"
                style={{
                  transformOrigin: '50% 66px',
                  transform: `translateX(-50%) rotate(${i * 45}deg)`,
                  animationDelay: `${i * 125}ms`
                }}
              >
                <div className="w-3 h-3 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse motion-reduce:animate-none shadow-lg"></div>
              </div>
            ))}
          </div>
          
          {/* Middle pulsing ring */}
          <div className="absolute inset-4 rounded-full border-2 border-secondary/60 animate-ping motion-reduce:animate-none" style={{animationDuration: '2s'}}></div>
          
          {/* Inner rotating ring */}
          <div className="absolute inset-6 rounded-full border-2 border-primary/80 animate-spin motion-reduce:animate-none" style={{animationDuration: '3s', animationDirection: 'reverse'}}>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Zap className="w-3 h-3 text-primary animate-pulse motion-reduce:animate-none" />
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <Target className="w-3 h-3 text-secondary animate-pulse delay-500 motion-reduce:animate-none" />
            </div>
          </div>
          
          {/* Logo in center - Now rotating */}
          <div className="absolute inset-8 flex items-center justify-center">
            <img 
              src={logoUrl} 
              alt="Next Trading Labs" 
              className="w-16 h-16 object-contain animate-spin motion-reduce:animate-none"
              style={{animationDuration: '6s'}}
              data-testid="loading-logo"
            />
          </div>
        </div>

        {/* Enhanced Neural Network Pattern */}
        <div className="relative w-80 h-24 overflow-hidden">
          {/* Dynamic flowing particles */}
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="absolute w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full"
                style={{
                  left: `${(i * 8) % 100}%`,
                  top: `${Math.sin(i) * 20 + 50}%`,
                  animationName: 'float-across',
                  animationDuration: `${3 + (i % 3)}s`,
                  animationIterationCount: 'infinite',
                  animationDelay: `${i * 0.3}s`,
                  opacity: 0.7
                }}
              />
            ))}
          </div>
          
          {/* Neural connection paths */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 96">
            <path 
              d="M0 48 Q80 20 160 48 T320 48" 
              stroke="url(#gradient1)" 
              strokeWidth="2" 
              fill="none" 
              className="animate-pulse motion-reduce:animate-none"
              style={{animationDuration: '2s'}}
            />
            <path 
              d="M0 24 Q80 60 160 24 T320 24" 
              stroke="url(#gradient2)" 
              strokeWidth="1.5" 
              fill="none" 
              className="animate-pulse motion-reduce:animate-none"
              style={{animationDuration: '2.5s', animationDelay: '0.5s'}}
            />
            <path 
              d="M0 72 Q80 40 160 72 T320 72" 
              stroke="url(#gradient3)" 
              strokeWidth="1.5" 
              fill="none" 
              className="animate-pulse motion-reduce:animate-none"
              style={{animationDuration: '3s', animationDelay: '1s'}}
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                <stop offset="50%" stopColor="var(--secondary)" stopOpacity="1" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.3" />
                <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                <stop offset="50%" stopColor="var(--secondary)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.4" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Enhanced Brain Loading Visualization */}
        <div className="relative">
          {/* Brain container with synaptic activity */}
          <div className="flex items-center justify-center space-x-6">
            <div className="relative">
              <Brain className="w-12 h-12 text-primary animate-pulse motion-reduce:animate-none" style={{animationDuration: '1.5s'}} />
              {/* Synaptic sparks around brain */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-secondary rounded-full animate-ping motion-reduce:animate-none"
                  style={{
                    top: `${20 + Math.sin(i * 60 * Math.PI / 180) * 25}px`,
                    left: `${20 + Math.cos(i * 60 * Math.PI / 180) * 25}px`,
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: '2s'
                  }}
                />
              ))}
            </div>
            
            {/* Processing indicators */}
            <div className="flex flex-col items-center space-y-2">
              <TrendingUp className="w-8 h-8 text-secondary animate-bounce motion-reduce:animate-none" style={{animationDelay: '0.5s'}} />
              <BarChart3 className="w-8 h-8 text-primary animate-bounce motion-reduce:animate-none" style={{animationDelay: '1s'}} />
            </div>
            
            <div className="relative">
              <Activity className="w-12 h-12 text-secondary animate-pulse motion-reduce:animate-none" style={{animationDuration: '2s'}} />
              {/* Activity waves */}
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-full border border-secondary/30 animate-ping motion-reduce:animate-none"
                  style={{
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: '2s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Loading Messages */}
        <div className="text-center h-16 flex flex-col justify-center">
          <div className={`transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            <p className="text-xl font-semibold text-foreground mb-2">
              {loadingPhrases[currentPhraseIndex]}
            </p>
            <div className="flex items-center justify-center space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse motion-reduce:animate-none"
                  style={{
                    animationDelay: `${i * 150}ms`,
                    animationDuration: '1.2s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Progress indicator */}
        <div className="w-96 h-2 bg-muted/20 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 animate-pulse motion-reduce:animate-none"></div>
          <div 
            className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full animate-pulse motion-reduce:animate-none"
            style={{
              width: '60%',
              animationDuration: '2s'
            }}
          ></div>
          <div 
            className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-slide-right motion-reduce:animate-none"
            style={{
              animationDuration: '2.5s',
              animationIterationCount: 'infinite'
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}