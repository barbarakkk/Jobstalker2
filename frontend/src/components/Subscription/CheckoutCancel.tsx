import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft } from 'lucide-react';
import { AppHeader } from '@/components/Layout/AppHeader';

export function CheckoutCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-gray-200 shadow-xl">
            <CardContent className="pt-12 pb-12 px-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Payment Cancelled
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Your payment was cancelled. No charges were made to your account.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                  <p className="text-gray-700 mb-4">
                    You can continue using our free plan with all the basic features. 
                    Upgrade to Pro anytime to unlock advanced features like:
                  </p>
                  <ul className="space-y-2 text-left text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>20 professional resumes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Unlimited jobs from extension</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>AI Job Matcher</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => navigate('/subscription')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 px-8 py-3"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

