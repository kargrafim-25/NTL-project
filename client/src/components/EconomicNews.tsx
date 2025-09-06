import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, AlertTriangle, TrendingUp, Calendar, ChevronDown, ChevronUp } from "lucide-react";
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
        return 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm';
      case 'medium':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm';
      case 'low':
        return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm';
      default:
        return 'bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-sm';
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

  const CompactNewsCard = ({ news, isUpcoming = false, isFirst = false }: { news: EconomicNews; isUpcoming?: boolean; isFirst?: boolean }) => {
    const [isOpen, setIsOpen] = useState(isFirst);

    if (isFirst) {
      return (
        <Card className="border-l-4 border-l-gradient-to-b from-blue-500 to-indigo-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 shadow-md" data-testid={`news-card-${news.id}`}>
          <CardHeader className="py-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xs font-medium leading-tight truncate" data-testid={`news-title-${news.id}`}>
                  {news.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground" data-testid={`news-time-${news.id}`}>
                    {format(new Date(news.eventTime), 'MMM dd, HH:mm')}
                  </span>
                  <Badge className={`${getImpactColor(news.impact)} text-xs h-4`} data-testid={`news-impact-${news.id}`}>
                    {getImpactIcon(news.impact)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 transition-all duration-200 border-l-2 border-l-gradient-to-b from-slate-400 to-gray-500 shadow-sm hover:shadow-md" data-testid={`news-card-${news.id}`}>
            <CardHeader className="py-1 px-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium truncate" data-testid={`news-title-${news.id}`}>
                      {news.title}
                    </span>
                    <Badge className={`${getImpactColor(news.impact)} text-xs h-3 px-1`} data-testid={`news-impact-${news.id}`}>
                      {getImpactIcon(news.impact)}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0" data-testid={`news-expand-${news.id}`}>
                  {isOpen ? <ChevronUp className="w-2 h-2" /> : <ChevronDown className="w-2 h-2" />}
                </Button>
              </div>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-1 border-l-2 border-l-indigo-400 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/20 dark:to-blue-950/20 shadow-sm" data-testid={`news-details-${news.id}`}>
            <CardContent className="py-2 px-3">
              <p className="text-xs text-muted-foreground mb-1" data-testid={`news-description-${news.id}`}>
                {news.description}
              </p>
              <div className="text-xs text-muted-foreground">
                {format(new Date(news.eventTime), 'MMM dd, HH:mm')} • {news.currency}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  if (loadingRecent && loadingUpcoming) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Economic News
          </CardTitle>
          <CardDescription>
            High-impact USD news events affecting XAUUSD
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-2 border-gradient-to-r from-indigo-200 to-blue-200 dark:from-indigo-800 dark:to-blue-800 shadow-lg bg-gradient-to-r from-indigo-50/30 to-blue-50/30 dark:from-indigo-950/30 dark:to-blue-950/30`} data-testid="economic-news-container">
      <CardHeader className="pb-2 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 rounded-t-lg border-b-2 border-indigo-200 dark:border-indigo-700">
        <CardTitle className="flex items-center gap-2 text-sm">
          <div className="p-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md">
            <TrendingUp className="w-3 h-3" />
          </div>
          <span className="bg-gradient-to-r from-indigo-700 to-blue-700 dark:from-indigo-300 dark:to-blue-300 bg-clip-text text-transparent font-semibold">
            Economic News
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 border border-indigo-200 dark:border-indigo-700">
            <TabsTrigger value="upcoming" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md" data-testid="tab-upcoming">
              Upcoming ({upcomingNews.length})
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md" data-testid="tab-recent">
              Recent ({recentNews.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-2 space-y-1" data-testid="upcoming-news-list">
            {upcomingNews.length === 0 ? (
              <div className="text-center py-3 text-muted-foreground">
                <Calendar className="w-4 h-4 mx-auto mb-1 opacity-50" />
                <p className="text-xs">No upcoming USD events</p>
              </div>
            ) : (
              upcomingNews.slice(0, 3).map((news, index) => 
                <CompactNewsCard 
                  key={news.id} 
                  news={news} 
                  isUpcoming={true} 
                  isFirst={index === 0} 
                />
              )
            )}
          </TabsContent>
          
          <TabsContent value="recent" className="mt-2 space-y-1" data-testid="recent-news-list">
            {recentNews.length === 0 ? (
              <div className="text-center py-3 text-muted-foreground">
                <Clock className="w-4 h-4 mx-auto mb-1 opacity-50" />
                <p className="text-xs">No recent USD events</p>
              </div>
            ) : (
              recentNews.slice(0, 3).map((news, index) => 
                <CompactNewsCard 
                  key={news.id} 
                  news={news} 
                  isUpcoming={false} 
                  isFirst={index === 0} 
                />
              )
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}