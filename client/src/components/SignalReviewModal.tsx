import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SignalReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingSignals: Array<{
    id: string;
    pair: string;
    direction: string;
    entryPrice: string;
    timeframe: string;
    closedAt: Date;
    daysSinceClose: number;
  }>;
}

export function SignalReviewModal({ isOpen, onClose, pendingSignals }: SignalReviewModalProps) {
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const [currentSignalIndex, setCurrentSignalIndex] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateActionMutation = useMutation({
    mutationFn: async ({ signalId, action }: { signalId: string; action: string }) => {
      const response = await fetch(`/api/v1/signals/${signalId}/action`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update signal');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications/pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/signals'] });
      
      toast({
        title: "Signal Updated",
        description: "Your trading outcome has been recorded!",
      });

      // Move to next signal or close modal
      if (currentSignalIndex < pendingSignals.length - 1) {
        setCurrentSignalIndex(currentSignalIndex + 1);
        setSelectedSignal(null);
      } else {
        onClose();
      }
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update signal. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAction = (action: 'successful' | 'unsuccessful' | 'didnt_take') => {
    const signal = pendingSignals[currentSignalIndex];
    if (signal) {
      updateActionMutation.mutate({ signalId: signal.id, action });
    }
  };

  if (!pendingSignals.length) return null;

  const currentSignal = pendingSignals[currentSignalIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-signal-review">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Signal Review Required
          </DialogTitle>
          <DialogDescription>
            Please update your trading results for completed signals.
            {pendingSignals.length > 1 && (
              <span className="block mt-2 text-sm text-gray-500">
                Signal {currentSignalIndex + 1} of {pendingSignals.length}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Signal Details */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800" data-testid="signal-details">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {currentSignal.direction === 'BUY' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className="font-semibold">{currentSignal.pair}</span>
                <Badge variant="outline">{currentSignal.direction}</Badge>
              </div>
              <Badge variant="secondary">{currentSignal.timeframe}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Entry Price:</span>
                <p className="font-medium">${currentSignal.entryPrice}</p>
              </div>
              <div>
                <span className="text-gray-500">Closed:</span>
                <p className="font-medium">
                  {currentSignal.daysSinceClose === 0 ? 'Today' : 
                   currentSignal.daysSinceClose === 1 ? 'Yesterday' :
                   `${currentSignal.daysSinceClose} days ago`}
                </p>
              </div>
            </div>
          </div>

          {/* Action Question */}
          <div className="text-center">
            <h3 className="font-medium mb-4">How did this trade turn out?</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => handleAction('successful')}
                disabled={updateActionMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white h-12"
                data-testid="button-successful"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Successful Trade - Made Profit
              </Button>
              
              <Button
                onClick={() => handleAction('unsuccessful')}
                disabled={updateActionMutation.isPending}
                variant="destructive"
                className="h-12"
                data-testid="button-unsuccessful"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Unsuccessful Trade - Lost Money
              </Button>
              
              <Button
                onClick={() => handleAction('didnt_take')}
                disabled={updateActionMutation.isPending}
                variant="outline"
                className="h-12"
                data-testid="button-didnt-take"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Didn't Take This Trade
              </Button>
            </div>
          </div>

          {/* Progress Indicator */}
          {pendingSignals.length > 1 && (
            <div className="pt-4 border-t">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Progress</span>
                <span>{currentSignalIndex + 1}/{pendingSignals.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentSignalIndex + 1) / pendingSignals.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}