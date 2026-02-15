import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/Layout/AppHeader';
import { 
  Check, 
  X, 
  Loader2,
  Crown,
  Zap,
  FileText,
  Briefcase,
  Sparkles,
  ArrowRight,
  CreditCard
} from 'lucide-react';
import { SubscriptionInfo } from '@/lib/types';
import { subscriptionApi } from '@/lib/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function SubscriptionPage() {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const feature = searchParams.get('feature'); // 'resume', etc.

  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  const loadSubscriptionInfo = async () => {
    try {
      setLoading(true);
      const info = await subscriptionApi.getStatus();
      setSubscriptionInfo(info);
    } catch (error) {
      console.error('Error loading subscription info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setProcessing(true);
      const session = await subscriptionApi.createCheckoutSession();
      // Redirect to Stripe checkout
      window.location.href = session.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setProcessing(true);
      const session = await subscriptionApi.createPortalSession();
      // Redirect to Stripe customer portal
      window.location.href = session.url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      alert('Failed to open subscription management. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!subscriptionInfo) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-slate-600">Failed to load subscription information.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isPro = subscriptionInfo.tier === 'pro';
  const isActive = subscriptionInfo.status === 'active';

  // Contextual message based on feature
  const getContextualMessage = () => {
    if (feature === 'resume') {
      return {
        title: 'Unlock More Resumes',
        description: 'Activate Pro to craft up to 10 professional resumes and showcase your versatility to different employers.',
        icon: FileText
      };
    }
    return null;
  };

  const contextualMessage = getContextualMessage();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Subscription</h1>
          <p className="text-slate-600">Manage your subscription and view your usage</p>
        </div>

        {/* Contextual Message Banner */}
        {contextualMessage && !isPro && (
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <contextualMessage.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {contextualMessage.title}
                  </h3>
                  <p className="text-slate-700 mb-4">
                    {contextualMessage.description}
                  </p>
                  <Button 
                    onClick={handleUpgrade}
                    disabled={processing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Activate Pro
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Plan */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Current Plan</CardTitle>
                <CardDescription className="mt-2">
                  {isPro ? 'You are on the Pro plan' : 'You are on the Free plan'}
                </CardDescription>
              </div>
              <Badge variant={isPro ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                {isPro ? 'Pro' : 'Free'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isPro && isActive && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">Active Subscription</p>
                    {subscriptionInfo.subscription?.current_period_end && (
                      <p className="text-sm text-slate-600">
                        Renews on {new Date(subscriptionInfo.subscription.current_period_end).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button onClick={handleManageSubscription} disabled={processing}>
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Manage Subscription
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Resumes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Used</span>
                  <span className="font-semibold">{subscriptionInfo.usage.resumes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Limit</span>
                  <span className="font-semibold">
                    {subscriptionInfo.limits.max_resumes === null 
                      ? 'Unlimited' 
                      : subscriptionInfo.limits.max_resumes}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: subscriptionInfo.limits.max_resumes === null 
                        ? '100%' 
                        : `${Math.min(100, (subscriptionInfo.usage.resumes / subscriptionInfo.limits.max_resumes) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Jobs from Extension
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Saved</span>
                  <span className="font-semibold">{subscriptionInfo.usage.jobs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Limit</span>
                  <span className="font-semibold">
                    {subscriptionInfo.limits.max_jobs_from_extension === null 
                      ? 'Unlimited' 
                      : subscriptionInfo.limits.max_jobs_from_extension}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: subscriptionInfo.limits.max_jobs_from_extension === null 
                        ? '100%' 
                        : `${Math.min(100, (subscriptionInfo.usage.jobs / subscriptionInfo.limits.max_jobs_from_extension) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card className={!isPro ? 'ring-2 ring-blue-500' : ''}>
            <CardHeader>
              <CardTitle className="text-xl">Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">$0<span className="text-lg text-slate-600">/month</span></div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>1 resume</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Unlimited job tracking</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>100 jobs from extension</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Unlimited jobs from web app</span>
                </li>
              </ul>
              {!isPro && (
                <Button className="w-full" variant="outline" disabled>
                  Current Plan
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className={isPro ? 'ring-2 ring-blue-500' : 'border-blue-500'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Pro</CardTitle>
                <Badge className="bg-blue-600">
                  <Crown className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              </div>
              <CardDescription>For serious job seekers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">$10<span className="text-lg text-slate-600">/month</span></div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>20 professional resumes</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Unlimited job tracking</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Unlimited jobs from extension</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Unlimited jobs from web app</span>
                </li>
              </ul>
              {isPro ? (
                <Button className="w-full" variant="outline" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  onClick={handleUpgrade}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Upgrade to Pro
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}





