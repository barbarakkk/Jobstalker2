import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { Login, Register, ProtectedRoute } from './components/Auth';
import { ExtensionAuth } from './components/Auth/ExtensionAuth';
import { Dashboard } from './components/Dashboard';
import JobDetail from './components/Dashboard/JobDetail';
import { Statistics } from './components/Statistics';
import ProfilePage from './components/Profile/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/extension" element={<ExtensionAuth />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
