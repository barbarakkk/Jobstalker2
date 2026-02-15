import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/Layout/AppHeader';
import { subscriptionApi } from '@/lib/api';

export function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Reload subscription info to get updated tier
    const reloadSubscription = async () => {
      try {
        await subscriptionApi.getStatus();
        // Wait a moment for webhook to process
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      } catch (error) {
        console.error('Error reloading subscription:', error);
        setLoading(false);
      }
    };

    reloadSubscription();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Processing your subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-green-200 shadow-xl">
            <CardContent className="pt-12 pb-12 px-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Payment Successful!
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Thank you for upgrading to Pro! Your subscription is now active and you have access to all premium features.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
                  <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">✓</span>
                      <span>Create up to 20 professional resumes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">✓</span>
                      <span>Save unlimited jobs from extension</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => navigate('/dashboard')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    onClick={() => navigate('/subscription')}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 px-8 py-3"
                  >
                    View Subscription
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

