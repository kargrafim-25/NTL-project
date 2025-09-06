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

  // Auto-open review modal if there are pending reviews and user hasn't been notified today
  useEffect(() => {
    if (pendingReviews?.shouldNotify && pendingReviews?.pendingSignals?.length > 0) {
      setIsReviewModalOpen(true);
    }
  }, [pendingReviews]);

  // Show discount popup when user completes monthly challenge
  useEffect(() => {
    if (monthlyStatus?.completed && monthlyStatus?.discountCode && !showDiscountPopup) {
      setShowDiscountPopup(true);
      toast({
        title: "🎉 Monthly Challenge Complete!",
        description: `You've earned a ${monthlyStatus.discountPercentage}% discount for next month!`,
        duration: 8000,
      });
    }
  }, [monthlyStatus, showDiscountPopup, toast]);

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

  const totalNotifications = (notificationData?.pendingReviews || 0) + (notificationData?.hasDiscount ? 1 : 0);

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
            {notificationData?.pendingReviews > 0 && (
              <div className="border-l-4 border-orange-500 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Signal Reviews Needed</p>
                    <p className="text-xs text-gray-500">
                      {notificationData.pendingReviews} closed signal{notificationData.pendingReviews !== 1 ? 's' : ''} need your input
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
            {notificationData?.hasDiscount && (
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm flex items-center gap-1">
                      <Gift className="w-4 h-4" />
                      Discount Available!
                    </p>
                    <p className="text-xs text-gray-500">
                      {notificationData.discountPercentage}% off your next bill
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
            {monthlyStatus && monthlyStatus.totalSignals > 0 && (
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Monthly Challenge</span>
                  {monthlyStatus.completed && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Signal reviews completed</span>
                    <span>{monthlyStatus.reviewedSignals}/{monthlyStatus.totalSignals}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        monthlyStatus.completed ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${(monthlyStatus.reviewedSignals / monthlyStatus.totalSignals) * 100}%` }}
                    />
                  </div>
                  {!monthlyStatus.completed && (
                    <p className="text-xs text-gray-500">
                      Complete all reviews to earn a {monthlyStatus.discountPercentage}% discount!
                    </p>
                  )}
                </div>
              </div>
            )}

            {totalNotifications === 0 && !monthlyStatus?.totalSignals && (
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
        pendingSignals={pendingReviews?.pendingSignals || []}
      />
    </>
  );
}