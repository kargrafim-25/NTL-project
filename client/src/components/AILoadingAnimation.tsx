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
      <div className="relative flex flex-col items-center justify-center p-8 min-h-screen">


        {/* Simple Brain at Bottom */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
          <Brain className="w-16 h-16 text-primary animate-pulse motion-reduce:animate-none" style={{animationDuration: '2s'}} />
        </div>

        {/* Special Designed Loading Messages */}
        <div className="text-center h-32 flex flex-col justify-center relative">
          <div className={`transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}`}>
            {/* Main text with hologram effect */}
            <div className="relative inline-block">
              <div className="absolute inset-0 blur-sm bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse">
                <h2 className="text-3xl font-bold tracking-wide">
                  {loadingPhrases[currentPhraseIndex]}
                </h2>
              </div>
              <h2 className="relative text-3xl font-bold tracking-wide bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                {loadingPhrases[currentPhraseIndex]}
              </h2>
              
              {/* Scanning line effect */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-primary to-transparent opacity-60 animate-slide-right motion-reduce:animate-none"></div>
              </div>
            </div>
            
            {/* Animated underline */}
            <div className="mt-4 relative h-1 w-80 mx-auto bg-muted/20 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary opacity-60 animate-slide-right motion-reduce:animate-none" style={{animationDuration: '2s'}}></div>
              <div className="absolute top-0 left-0 h-full w-2 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-slide-right motion-reduce:animate-none" style={{animationDuration: '2.5s'}}></div>
            </div>
            
            {/* Particle constellation around text */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-secondary rounded-full animate-pulse motion-reduce:animate-none"
                  style={{
                    left: `${20 + (i * 10)}%`,
                    top: `${30 + Math.sin(i) * 20}%`,
                    animationDelay: `${i * 200}ms`,
                    animationDuration: '2s'
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