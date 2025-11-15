import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login, ProtectedRoute, AuthCallback } from './components/Auth';
import { ExtensionAuth } from './components/Auth/ExtensionAuth';
import { LandingPage } from './components/LandingPage';

// Lazy load components for better performance - only load when needed
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const JobDetail = lazy(() => import('./components/Dashboard/JobDetail'));
const Statistics = lazy(() => import('./components/Statistics').then(module => ({ default: module.Statistics })));
const ProfilePage = lazy(() => import('./components/Profile/ProfilePage'));
const ResumeTemplateSelectionPage = lazy(() => import('./components/ResumeBuilder/TemplateSelection').then(module => ({ default: module.ResumeTemplateSelectionPage })));
const ResumeEditPage = lazy(() => import('./components/ResumeBuilder/Edit').then(module => ({ default: module.ResumeEditPage })));
const ResumeFinalizePage = lazy(() => import('./components/ResumeBuilder/Finalize').then(module => ({ default: module.ResumeFinalizePage })));
const AIGeneratePage = lazy(() => import('./components/ResumeBuilder/AIGenerate').then(module => ({ default: module.AIGeneratePage })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#f5f8ff]">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
      <p className="text-slate-600 font-semibold">Loading...</p>
    </div>
  </div>
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
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <Dashboard />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/statistics" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <Statistics />
                </Suspense>
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
                <Suspense fallback={<LoadingFallback />}>
                  <ProfilePage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          {/* Resume Builder routes */}
          <Route 
            path="/resume-builder" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <AIGeneratePage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/resume-builder/templates" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <ResumeTemplateSelectionPage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/resume-builder/wizard" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <AIGeneratePage />
                </Suspense>
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
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
