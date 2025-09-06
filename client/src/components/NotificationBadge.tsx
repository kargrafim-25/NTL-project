import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Gift, CheckCircle2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SignalReviewModal } from './SignalReviewModal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function NotificationBadge() {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Get notification count
  const { data: notificationData } = useQuery({
    queryKey: ['/api/v1/notifications/count'],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Get pending reviews
  const { data: pendingReviews } = useQuery({
    queryKey: ['/api/v1/notifications/pending-reviews'],
    enabled: isAuthenticated && isReviewModalOpen,
  });

  // Get monthly status
  const { data: monthlyStatus } = useQuery({
    queryKey: ['/api/v1/notifications/monthly-status'],
    enabled: isAuthenticated,
    refetchInterval: 60000, // Check every minute
  });

  // Type assertions for data safety
  const safeNotificationData = notificationData as any || {};
  const safePendingReviews = pendingReviews as any || {};
  const safeMonthlyStatus = monthlyStatus as any || {};

  // Auto-open review modal if there are pending reviews and user hasn't been notified today
  useEffect(() => {
    if (safePendingReviews?.shouldNotify && safePendingReviews?.pendingSignals?.length > 0) {
      setIsReviewModalOpen(true);
    }
  }, [safePendingReviews]);

  // Show discount popup when user completes monthly challenge
  useEffect(() => {
    if (safeMonthlyStatus?.completed && safeMonthlyStatus?.discountCode && !showDiscountPopup) {
      setShowDiscountPopup(true);
      toast({
        title: "🎉 Monthly Challenge Complete!",
        description: `You've earned a ${safeMonthlyStatus.discountPercentage}% discount for next month!`,
        duration: 8000,
      });
    }
  }, [safeMonthlyStatus, showDiscountPopup, toast]);

  const handleClaimDiscount = async () => {
    try {
      const response = await fetch('/api/v1/notifications/claim-discount', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        navigator.clipboard.writeText(data.discountCode);
        toast({
          title: "Discount Code Copied!",
          description: `Code "${data.discountCode}" copied to clipboard. Use it before your next bill.`,
          duration: 10000,
        });
        setShowDiscountPopup(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim discount code. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) return null;

  const totalNotifications = (safeNotificationData?.pendingReviews || 0) + (safeNotificationData?.hasDiscount && safeNotificationData?.discountPercentage > 0 ? 1 : 0);

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative p-2"
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5" />
            {totalNotifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                data-testid="badge-notification-count"
              >
                {totalNotifications}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80" align="end" data-testid="popup-notifications">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Notifications</h3>
            
            {/* Pending Reviews */}
            {safeNotificationData?.pendingReviews > 0 && (
              <div className="border-l-4 border-orange-500 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Signal Reviews Needed</p>
                    <p className="text-xs text-gray-500">
                      {safeNotificationData.pendingReviews} closed signal{safeNotificationData.pendingReviews !== 1 ? 's' : ''} need your input
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setIsReviewModalOpen(true)}
                    data-testid="button-review-signals"
                  >
                    Review
                  </Button>
                </div>
              </div>
            )}

            {/* Available Discount */}
            {safeNotificationData?.hasDiscount && safeNotificationData?.discountPercentage > 0 && (
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm flex items-center gap-1">
                      <Gift className="w-4 h-4" />
                      Discount Available!
                    </p>
                    <p className="text-xs text-gray-500">
                      {safeNotificationData.discountPercentage}% off your next bill
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleClaimDiscount}
                    data-testid="button-claim-discount"
                  >
                    Claim
                  </Button>
                </div>
              </div>
            )}

            {/* Monthly Progress */}
            {safeMonthlyStatus && safeMonthlyStatus.totalSignals > 0 && (
              <div className="border-t pt-3">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">🏆</span>
                      </div>
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Billing Cycle Challenge</span>
                    </div>
                    {safeMonthlyStatus.completed && (
                      <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">Complete!</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">Signal Reviews Progress</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{safeMonthlyStatus.reviewedSignals}/{safeMonthlyStatus.totalSignals}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          safeMonthlyStatus.completed 
                            ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-lg' 
                            : 'bg-gradient-to-r from-blue-400 to-purple-500 shadow-md'
                        }`}
                        style={{ width: `${(safeMonthlyStatus.reviewedSignals / safeMonthlyStatus.totalSignals) * 100}%` }}
                      />
                    </div>
                    
                    {!safeMonthlyStatus.completed ? (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-2">
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium text-center">
                          {safeMonthlyStatus.allSignalsReviewed ? (
                            <>
                              ✅ All signals reviewed! 
                              {safeMonthlyStatus.daysUntilBillingCycleEnd <= 1 ? (
                                <span className="block mt-1 text-green-600 dark:text-green-400 font-bold">
                                  🎁 6% discount available within final day!
                                </span>
                              ) : (
                                <span className="block mt-1 text-blue-600 dark:text-blue-400">
                                  Discount available in final day ({safeMonthlyStatus.daysUntilBillingCycleEnd} days left)
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              🎁 Complete all reviews to earn a <span className="font-bold">6% discount</span> in the final day!
                              {safeMonthlyStatus.billingCycleEnd && (
                                <span className="block mt-1 text-yellow-600 dark:text-yellow-400">
                                  Deadline: {new Date(safeMonthlyStatus.billingCycleEnd).toLocaleDateString()}
                                </span>
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-2">
                        <p className="text-xs text-green-700 dark:text-green-300 font-medium text-center">
                          🎉 Challenge Complete! You've earned a <span className="font-bold">6% discount</span>!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {totalNotifications === 0 && !safeMonthlyStatus?.totalSignals && (
              <p className="text-sm text-gray-500 text-center py-4">
                No notifications at the moment
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Signal Review Modal */}
      <SignalReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        pendingSignals={(safePendingReviews?.pendingSignals || []).map((signal: any) => ({
          ...signal,
          stopLoss: signal.stopLoss || '0.00',
          takeProfit: signal.takeProfit || '0.00'
        }))}
      />
    </>
  );
}