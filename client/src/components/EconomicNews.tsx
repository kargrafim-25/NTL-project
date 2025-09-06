import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
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
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const NewsCard = ({ news, isUpcoming = false }: { news: EconomicNews; isUpcoming?: boolean }) => (
    <Card key={news.id} className="border-l-4 border-l-blue-500 dark:border-l-blue-400" data-testid={`news-card-${news.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium" data-testid={`news-title-${news.id}`}>
              {news.title}
            </CardTitle>
            <CardDescription className="mt-1 text-xs" data-testid={`news-description-${news.id}`}>
              {news.description}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2 ml-4">
            <Badge 
              className={`${getImpactColor(news.impact)} text-xs`}
              data-testid={`news-impact-${news.id}`}
            >
              <span className="flex items-center gap-1">
                {getImpactIcon(news.impact)}
                {news.impact.toUpperCase()}
              </span>
            </Badge>
            <Badge variant="outline" className="text-xs" data-testid={`news-currency-${news.id}`}>
              {news.currency}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span data-testid={`news-time-${news.id}`}>
              {format(new Date(news.eventTime), 'MMM dd, HH:mm')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span data-testid={`news-relative-time-${news.id}`}>
              {isUpcoming 
                ? `in ${formatDistanceToNow(new Date(news.eventTime))}`
                : formatDistanceToNow(new Date(news.eventTime), { addSuffix: true })
              }
            </span>
          </div>
        </div>
        {news.previousValue && (
          <div className="mt-2 text-xs text-muted-foreground">
            Previous: {news.previousValue}
            {news.forecastValue && ` | Forecast: ${news.forecastValue}`}
            {news.actualValue && ` | Actual: ${news.actualValue}`}
          </div>
        )}
      </CardContent>
    </Card>
  );

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
    <Card className={className} data-testid="economic-news-container">
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
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Upcoming ({upcomingNews.length})
            </TabsTrigger>
            <TabsTrigger value="recent" data-testid="tab-recent">
              Recent ({recentNews.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-4 space-y-3" data-testid="upcoming-news-list">
            {upcomingNews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming high-impact USD events</p>
              </div>
            ) : (
              upcomingNews.map(news => <NewsCard key={news.id} news={news} isUpcoming={true} />)
            )}
          </TabsContent>
          
          <TabsContent value="recent" className="mt-4 space-y-3" data-testid="recent-news-list">
            {recentNews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent high-impact USD events</p>
              </div>
            ) : (
              recentNews.map(news => <NewsCard key={news.id} news={news} isUpcoming={false} />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}