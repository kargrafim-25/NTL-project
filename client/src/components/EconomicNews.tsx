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
      const response = await fetch('/api/v1/news/recent?limit=8');
      if (!response.ok) throw new Error('Failed to fetch recent news');
      return response.json() as Promise<EconomicNews[]>;
    },
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    staleTime: 4 * 60 * 1000, // Consider data stale after 4 minutes
  });

  const { data: upcomingNews = [], isLoading: loadingUpcoming } = useQuery({
    queryKey: ['/api/v1/news/upcoming'],
    queryFn: async () => {
      const response = await fetch('/api/v1/news/upcoming?limit=8');
      if (!response.ok) throw new Error('Failed to fetch upcoming news');
      return response.json() as Promise<EconomicNews[]>;
    },
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes  
    staleTime: 4 * 60 * 1000, // Consider data stale after 4 minutes
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

  // Show all simultaneous events in the current time group
  const activeTimeGroup = upcomingNews.length > 0 ? upcomingNews : recentNews;
  const isUpcoming = upcomingNews.length > 0;

  if (activeTimeGroup.length === 0) {
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
          Economic News {isUpcoming ? '(Upcoming)' : '(Recent)'}
        </CardTitle>
        {activeTimeGroup.length > 1 && (
          <p className="text-sm text-muted-foreground mt-1">
            {activeTimeGroup.length} simultaneous events at {format(new Date(activeTimeGroup[0].eventTime), 'MMM dd, HH:mm')}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {activeTimeGroup.map((newsItem, index) => (
          <div key={newsItem.id} className={`p-3 rounded-lg border ${getImpactBgColor(newsItem.impact)} ${index > 0 ? 'mt-3' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 min-w-0">
                {newsItem.sourceUrl ? (
                  <a 
                    href={newsItem.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-semibold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1 group"
                    data-testid={`link-news-title-${index}`}
                  >
                    <span className="truncate">{newsItem.title}</span>
                    <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </a>
                ) : (
                  <span className="font-semibold text-red-500" data-testid={`text-news-title-${index}`}>
                    {newsItem.title}
                  </span>
                )}
              </div>
              <Badge className={getImpactColor(newsItem.impact)} data-testid={`text-news-impact-${index}`}>
                {newsItem.impact.toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Currency:</span>
                <div className="font-semibold" data-testid={`text-news-currency-${index}`}>{newsItem.currency}</div>
              </div>
              {newsItem.previousValue && (
                <div>
                  <span className="text-muted-foreground">Previous:</span>
                  <div className="font-semibold text-muted-foreground" data-testid={`text-news-previous-${index}`}>{newsItem.previousValue}</div>
                </div>
              )}
              {newsItem.forecastValue && (
                <div>
                  <span className="text-muted-foreground">Forecast:</span>
                  <div className="font-semibold text-red-500" data-testid={`text-news-forecast-${index}`}>{newsItem.forecastValue}</div>
                </div>
              )}
              {newsItem.actualValue && (
                <div>
                  <span className="text-muted-foreground">Actual:</span>
                  <div className="font-semibold text-green-500" data-testid={`text-news-actual-${index}`}>{newsItem.actualValue}</div>
                </div>
              )}
            </div>
            
            {newsItem.description && (
              <div className="mt-2 text-xs text-muted-foreground" data-testid={`text-news-description-${index}`}>
                {newsItem.description}
              </div>
            )}
          </div>
        ))}

        {/* Time and Links */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            <span data-testid="text-news-time">{format(new Date(activeTimeGroup[0].eventTime), 'MMM dd, HH:mm')}</span>
            {activeTimeGroup.length > 1 && (
              <span className="ml-2">• {activeTimeGroup.length} events</span>
            )}
          </div>
          <a 
            href="https://www.forexfactory.com/calendar?week=this&currency=USD"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
            data-testid="link-forexfactory-events"
          >
            <Badge 
              variant="outline" 
              className="border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer group-hover:border-red-500/50"
              data-testid="badge-news-count"
            >
              <span className="flex items-center gap-1">
                View Calendar
                <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </span>
            </Badge>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}