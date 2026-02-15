import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivate: () => void;
  processing?: boolean;
}

export function UpgradeModal({ open, onOpenChange, onActivate, processing = false }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl">
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-blue-50 to-blue-100 border-b border-blue-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
              Upgrade to Pro
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-base">
              Unlock advanced features and create up to 20 professional resumes
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content Section */}
        <div className="px-8 py-6 bg-white">
          {/* Pricing */}
          <div className="text-center mb-6 pb-6 border-b border-gray-200">
            <div className="text-4xl font-bold text-gray-900 mb-1">
              $10
              <span className="text-lg font-normal text-gray-600">/month</span>
            </div>
            <p className="text-sm text-gray-500">Billed monthly</p>
          </div>

          {/* Features List */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-gray-700 text-base">20 professional resumes</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-gray-700 text-base">Unlimited job tracking</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-gray-700 text-base">Unlimited jobs from extension</span>
            </div>
          </div>
        </div>

        {/* Footer with CTA */}
        <DialogFooter className="px-8 pb-8 pt-0 bg-white flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={processing}
            className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium h-11"
          >
            Maybe Later
          </Button>
          <Button 
            onClick={onActivate}
            disabled={processing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 shadow-sm hover:shadow-md transition-all"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Activate Pro Now'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

