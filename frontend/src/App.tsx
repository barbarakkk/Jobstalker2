import { lazy, Suspense, startTransition } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login, ProtectedRoute, AuthCallback } from './components/Auth';
import { ExtensionAuth } from './components/Auth/ExtensionAuth';
import { LandingPage } from './components/LandingPage';
import { RegistrationComplete } from './components/Auth/RegistrationComplete';

// Eager load frequently used pages for instant navigation
import { Dashboard } from './components/Dashboard';
import ProfilePage from './components/Profile/ProfilePage';
import { ResumeBuilderHome } from './components/ResumeBuilder/ResumeBuilderHome';

// Lazy load less frequently used components
const JobDetail = lazy(() => import('./components/Dashboard/JobDetail'));
const ResumeEditPage = lazy(() => import('./components/ResumeBuilder/Edit').then(module => ({ default: module.ResumeEditPage })));
const ResumeFinalizePage = lazy(() => import('./components/ResumeBuilder/Finalize').then(module => ({ default: module.ResumeFinalizePage })));
const AIGeneratePage = lazy(() => import('./components/ResumeBuilder/AIGenerate').then(module => ({ default: module.AIGeneratePage })));
// Payment system disabled for production - will be integrated later
// const SubscriptionPage = lazy(() => import('./components/Subscription/SubscriptionPage').then(module => ({ default: module.SubscriptionPage })));
// const CheckoutSuccess = lazy(() => import('./components/Subscription/CheckoutSuccess').then(module => ({ default: module.CheckoutSuccess })));
// const CheckoutCancel = lazy(() => import('./components/Subscription/CheckoutCancel').then(module => ({ default: module.CheckoutCancel })));

// Minimal loading fallback for instant feel
const LoadingFallback = () => (
  <div className="min-h-screen bg-[#f5f8ff]"></div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/extension" element={<ExtensionAuth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route 
            path="/register/complete" 
            element={
              <ProtectedRoute>
                <RegistrationComplete />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/jobs/:id" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <JobDetail />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          {/* Resume Builder routes */}
          {/* Main resume builder home with "Craft New" and "My Resumes" options */}
          <Route 
            path="/resume-builder" 
            element={
              <ProtectedRoute>
                <ResumeBuilderHome />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/resume-builder/ai-generate" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <AIGeneratePage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/resume-builder/edit" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <ResumeEditPage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/resume-builder/finalize" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <ResumeFinalizePage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          {/* Subscription routes - disabled for production */}
          {/* <Route 
            path="/subscription" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <SubscriptionPage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/subscription/success" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <CheckoutSuccess />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/subscription/cancel" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <CheckoutCancel />
                </Suspense>
              </ProtectedRoute>
            } 
          /> */}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
