import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, AlertTriangle, TrendingUp, Calendar, ChevronDown, ChevronUp, BookOpen, ExternalLink } from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import type { EconomicNews } from "@shared/schema";

interface EconomicNewsProps {
  className?: string;
}

export function EconomicNews({ className }: EconomicNewsProps) {
  const { data: recentNews = [], isLoading: loadingRecent } = useQuery({
    queryKey: ['/api/v1/news/recent'],
    queryFn: async () => {
      const response = await fetch('/api/v1/news/recent?limit=5&currency=USD&impact=high');
      if (!response.ok) throw new Error('Failed to fetch recent news');
      return response.json() as Promise<EconomicNews[]>;
    },
  });

  const { data: upcomingNews = [], isLoading: loadingUpcoming } = useQuery({
    queryKey: ['/api/v1/news/upcoming'],
    queryFn: async () => {
      const response = await fetch('/api/v1/news/upcoming?limit=5&currency=USD&impact=high');
      if (!response.ok) throw new Error('Failed to fetch upcoming news');
      return response.json() as Promise<EconomicNews[]>;
    },
  });

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-red-400 text-white';
      case 'low':
        return 'bg-red-300 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <AlertTriangle className="w-3 h-3" />;
      case 'medium':
        return <TrendingUp className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const eventTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - eventTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getImpactBgColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500/10 border-red-500/20';
      case 'medium':
        return 'bg-red-400/10 border-red-400/20';
      case 'low':
        return 'bg-red-300/10 border-red-300/20';
      default:
        return 'bg-muted/10 border-muted/20';
    }
  };

  if (loadingRecent && loadingUpcoming) {
    return (
      <Card className="trading-card" data-testid="economic-news-container">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-red-500" />
            Economic News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-12 bg-muted/20 rounded-lg"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-8 bg-muted/20 rounded"></div>
              <div className="h-8 bg-muted/20 rounded"></div>
            </div>
            <div className="h-16 bg-muted/20 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get the most recent/important news item
  const featuredNews = upcomingNews.length > 0 ? upcomingNews[0] : recentNews[0];

  if (!featuredNews) {
    return (
      <Card className="trading-card" data-testid="economic-news-container">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-muted-foreground" />
            Economic News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted/20 rounded-full flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No News Available</h3>
            <p className="text-sm text-muted-foreground">
              No high-impact USD events scheduled at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="trading-card" data-testid="economic-news-container">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="mr-2 h-5 w-5 text-red-500" />
          Economic News
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-center justify-between p-3 rounded-lg border ${getImpactBgColor(featuredNews.impact)}`}>
          <div className="flex-1 min-w-0">
            {featuredNews.sourceUrl ? (
              <a 
                href={featuredNews.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1 group"
                data-testid="link-news-title"
              >
                <span className="truncate">{featuredNews.title}</span>
                <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </a>
            ) : (
              <span className="font-semibold text-red-500" data-testid="text-news-title">
                {featuredNews.title}
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-muted-foreground ml-2">
            <Clock className="h-3 w-3 mr-1" />
            <span data-testid="text-news-time">{format(new Date(featuredNews.eventTime), 'MMM dd, HH:mm')}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Currency:</span>
            <div className="font-semibold" data-testid="text-news-currency">{featuredNews.currency}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Impact:</span>
            <div className="font-semibold">
              <Badge className={getImpactColor(featuredNews.impact)} data-testid="text-news-impact">
                {featuredNews.impact.toUpperCase()}
              </Badge>
            </div>
          </div>
          {featuredNews.previousValue && (
            <div>
              <span className="text-muted-foreground">Previous:</span>
              <div className="font-semibold text-muted-foreground" data-testid="text-news-previous">{featuredNews.previousValue}</div>
            </div>
          )}
          {featuredNews.forecastValue && (
            <div>
              <span className="text-muted-foreground">Forecast:</span>
              <div className="font-semibold text-red-500" data-testid="text-news-forecast">{featuredNews.forecastValue}</div>
            </div>
          )}
        </div>
        
        {featuredNews.description && (
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="text-sm font-medium text-red-500 mb-2">Event Details:</div>
            <p className="text-xs text-muted-foreground" data-testid="text-news-description">
              {featuredNews.description}
            </p>
          </div>
        )}

        {/* Additional News Count */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className="border-red-500/30 text-red-500"
            data-testid="badge-news-count"
          >
            {upcomingNews.length + recentNews.length} USD Events
          </Badge>
          <div className="text-xs text-muted-foreground">
            High-impact events only
          </div>
        </div>
      </CardContent>
    </Card>
  );
}