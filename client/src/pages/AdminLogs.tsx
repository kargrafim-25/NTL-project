import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { BarChart3, Clock, User, TrendingUp, AlertCircle, CheckCircle, Calendar, Database } from "lucide-react";

interface APILogEntry {
  timestamp: string;
  userId: string;
  timeframe: string;
  subscriptionTier: string;
  request: {
    symbol: string;
    timeframe: string;
    userTier: string;
  };
  response: any;
  executionTime: number;
  success: boolean;
  error?: string;
}

export default function AdminLogs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedLogFile, setSelectedLogFile] = useState<string | null>(null);

  // Get available log files
  const { data: logFiles, isLoading: loadingFiles } = useQuery({
    queryKey: ['/api/v1/logs'],
    enabled: !!user,
    retry: false,
  });

  // Get logs for selected date
  const { data: logsData, isLoading: loadingLogs, refetch } = useQuery({
    queryKey: ['/api/v1/logs', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/v1/logs?date=${selectedDate}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      return response.json();
    },
    enabled: !!selectedDate && !!user,
    retry: false,
  });

  useEffect(() => {
    if (isUnauthorizedError(new Error('401'))) {
      toast({
        title: "Unauthorized",
        description: "Admin access required",
        variant: "destructive",
      });
    }
  }, [toast]);

  const logs: APILogEntry[] = logsData?.logs || [];
  const availableFiles: string[] = logFiles?.logFiles || [];

  // Calculate statistics
  const stats = {
    totalCalls: logs.length,
    successfulCalls: logs.filter(log => log.success).length,
    failedCalls: logs.filter(log => !log.success).length,
    avgExecutionTime: logs.length > 0 ? Math.round(logs.reduce((sum, log) => sum + log.executionTime, 0) / logs.length) : 0,
    uniqueUsers: new Set(logs.map(log => log.userId)).size,
    starterUsers: logs.filter(log => log.subscriptionTier === 'starter').length,
    proUsers: logs.filter(log => log.subscriptionTier === 'pro').length,
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatExecutionTime = (time: number) => {
    return `${(time / 1000).toFixed(1)}s`;
  };

  if (!user) {
    return <div className="p-8 text-center">Please log in to access admin logs.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="admin-logs-page">
      <div className="flex items-center space-x-2 mb-6">
        <Database className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">API Results Dashboard</h1>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-border rounded-md"
              data-testid="input-date-selector"
            />
            <Button onClick={() => refetch()} data-testid="button-refresh-logs">
              Refresh
            </Button>
          </div>
          
          {availableFiles.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Available log files:</p>
              <div className="flex flex-wrap gap-2">
                {availableFiles.map(file => (
                  <Badge key={file} variant="outline" className="text-xs">
                    {file.replace('signal-generation-', '').replace('.json', '')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total API Calls</p>
                <p className="text-2xl font-bold">{stats.totalCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {stats.totalCalls > 0 ? Math.round((stats.successfulCalls / stats.totalCalls) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{formatExecutionTime(stats.avgExecutionTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Unique Users</p>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Calls List */}
      <Card>
        <CardHeader>
          <CardTitle>API Calls for {selectedDate}</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="text-center py-8">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No API calls found for this date
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    log.success ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:bg-red-950'
                  }`}
                  data-testid={`log-entry-${index}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {log.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <Badge variant={log.subscriptionTier === 'pro' ? 'default' : 'secondary'}>
                        {log.subscriptionTier.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{log.request.timeframe}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-sm font-medium">User ID</p>
                      <p className="text-sm text-muted-foreground">{log.userId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Execution Time</p>
                      <p className="text-sm text-muted-foreground">{formatExecutionTime(log.executionTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Symbol</p>
                      <p className="text-sm text-muted-foreground">{log.request.symbol}</p>
                    </div>
                  </div>

                  {log.success && log.response ? (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                      <p className="text-sm font-medium mb-2">Response:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Action:</span> 
                          <Badge variant={log.response.action === 'BUY' ? 'default' : 'destructive'} className="ml-2">
                            {log.response.action}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Entry:</span> ${log.response.entry}
                        </div>
                        <div>
                          <span className="font-medium">Stop Loss:</span> ${log.response.stop_loss}
                        </div>
                        <div>
                          <span className="font-medium">Take Profit:</span> ${log.response.take_profit}
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span> {log.response.confidence}%
                        </div>
                        <div>
                          <span className="font-medium">Market Sentiment:</span> 
                          <Badge variant="outline" className="ml-2">
                            {log.response.ai_analysis?.market_sentiment || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                      
                      {log.response.ai_analysis && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium">AI Analysis:</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.response.ai_analysis.brief}
                          </p>
                          {log.response.ai_analysis.detailed && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {log.response.ai_analysis.detailed}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : log.error && (
                    <div className="bg-red-100 dark:bg-red-900 p-3 rounded border">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">Error:</p>
                      <p className="text-sm text-red-600 dark:text-red-400">{log.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}