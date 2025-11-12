import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { Login, ProtectedRoute, AuthCallback } from './components/Auth';
import { ExtensionAuth } from './components/Auth/ExtensionAuth';
import { Dashboard } from './components/Dashboard';
import JobDetail from './components/Dashboard/JobDetail';
import { Statistics } from './components/Statistics';
import ProfilePage from './components/Profile/ProfilePage';
import { ResumeTemplateSelectionPage } from './components/ResumeBuilder/TemplateSelection';
import { ResumeEditPage } from './components/ResumeBuilder/Edit';
import { ResumeFinalizePage } from './components/ResumeBuilder/Finalize';
import { AIGeneratePage } from './components/ResumeBuilder/AIGenerate';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/extension" element={<ExtensionAuth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        {/* Resume Builder routes */}
        <Route path="/resume-builder" element={<ProtectedRoute><AIGeneratePage /></ProtectedRoute>} />
        <Route path="/resume-builder/templates" element={<ProtectedRoute><ResumeTemplateSelectionPage /></ProtectedRoute>} />
        <Route path="/resume-builder/wizard" element={<ProtectedRoute><AIGeneratePage /></ProtectedRoute>} />
        <Route path="/resume-builder/ai-generate" element={<ProtectedRoute><AIGeneratePage /></ProtectedRoute>} />
        <Route path="/resume-builder/edit" element={<ProtectedRoute><ResumeEditPage /></ProtectedRoute>} />
        <Route path="/resume-builder/finalize" element={<ProtectedRoute><ResumeFinalizePage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
