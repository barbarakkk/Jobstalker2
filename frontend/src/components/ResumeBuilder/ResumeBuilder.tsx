import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, FilePlus, Sparkles, ArrowLeft, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ResumeBuilder() {
  const [jobDescription, setJobDescription] = useState('');
  const [currentResume, setCurrentResume] = useState('');
  const [generatedResume, setGeneratedResume] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleGenerateResume = async () => {
    if (!jobDescription.trim() || !currentResume.trim()) {
      alert('Please fill in both job description and current resume fields.');
      return;
    }

    setIsGenerating(true);
    
    // Simulate API call - replace with actual backend integration later
    setTimeout(() => {
      setGeneratedResume(`Generated resume content will appear here...
      
This is a placeholder for the AI-generated resume. The backend integration will be implemented later to:

1. Analyze the job description
2. Extract key requirements and skills
3. Optimize the resume content
4. Format for ATS compatibility
5. Return the enhanced resume

For now, this demonstrates the frontend interface.`);
      setIsGenerating(false);
    }, 2000);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Professional Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 sm:space-x-4">
                             <img src="/src/assets/ColoredLogoHorizontal.svg" alt="JobStalker" className="h-8 sm:h-10" />
               <div className="hidden sm:block">
               </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <a 
                href="/dashboard" 
                className="text-slate-600 hover:text-blue-700 transition-colors font-medium relative group"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/dashboard');
                }}
              >
                Jobs
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a 
                href="/statistics" 
                className="text-slate-600 hover:text-blue-700 transition-colors font-medium relative group"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/statistics');
                }}
              >
                Statistics
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#" className="text-blue-700 font-semibold relative group">
                AI Resume Builder
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#" className="text-slate-600 hover:text-blue-700 transition-colors font-medium relative group">
                Profile
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors relative z-50"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Menu className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <nav className="mt-4 pb-4 border-t border-slate-200 bg-white rounded-lg shadow-lg">
              <div className="flex flex-col space-y-1 pt-4 px-4">
                <a 
                  href="/dashboard" 
                  className="text-slate-700 hover:text-blue-700 transition-colors font-medium py-3 px-4 rounded-lg hover:bg-slate-50 flex items-center space-x-3 group"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/dashboard');
                    closeMobileMenu();
                  }}
                >
                  <div className="w-2 h-2 bg-slate-300 rounded-full group-hover:bg-blue-500 transition-colors"></div>
                  <span>Jobs Dashboard</span>
                </a>
                <a 
                  href="/statistics" 
                  className="text-slate-700 hover:text-blue-700 transition-colors font-medium py-3 px-4 rounded-lg hover:bg-slate-50 flex items-center space-x-3 group"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/statistics');
                    closeMobileMenu();
                  }}
                >
                  <div className="w-2 h-2 bg-slate-300 rounded-full group-hover:bg-blue-500 transition-colors"></div>
                  <span>Statistics</span>
                </a>
                <a 
                  href="#" 
                  className="text-blue-700 font-semibold py-3 px-4 rounded-lg bg-blue-50 border border-blue-200 flex items-center space-x-3"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>AI Resume Builder</span>
                </a>
                <a 
                  href="#" 
                  className="text-slate-700 hover:text-blue-700 transition-colors font-medium py-3 px-4 rounded-lg hover:bg-slate-50 flex items-center space-x-3 group"
                >
                  <div className="w-2 h-2 bg-slate-300 rounded-full group-hover:bg-blue-500 transition-colors"></div>
                  <span>Profile</span>
                </a>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 px-4">AI Resume Builder</h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-4">
              Paste your resume and job description below to generate an ATS-optimized resume tailored for your application.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {/* Job Description Section */}
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
                <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl font-semibold text-slate-900">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                  <span>Job Description / Requirements</span>
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Paste the job description or requirements to help optimize your resume.
                </p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <Textarea
                  placeholder="Paste the job description or requirements here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[150px] sm:min-h-[200px] resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                />
                <p className="text-sm text-slate-500 mt-3">
                  Only text is supported. Please copy and paste the job description here.
                </p>
              </CardContent>
            </Card>

            {/* Current Resume Section */}
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
                <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl font-semibold text-slate-900">
                  <FilePlus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                  <span>Your Current Resume</span>
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Paste your current resume content to be enhanced by our AI.
                </p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <Textarea
                  placeholder="Paste your current resume here..."
                  value={currentResume}
                  onChange={(e) => setCurrentResume(e.target.value)}
                  className="min-h-[150px] sm:min-h-[200px] resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                />
                <p className="text-sm text-slate-500 mt-3">
                  Only text is supported. Please copy and paste your resume here.
                </p>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleGenerateResume}
                disabled={isGenerating || !jobDescription.trim() || !currentResume.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm sm:text-base">Generating Resume...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Generate Resume</span>
                  </div>
                )}
              </Button>
            </div>

            {/* Generated Resume Section */}
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
                <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl font-semibold text-slate-900">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                  <span>Generated Resume</span>
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Your AI-enhanced resume optimized for the job description.
                </p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <Textarea
                  placeholder="No resume generated yet. Enter your data and click 'Generate Resume' above."
                  value={generatedResume}
                  onChange={(e) => setGeneratedResume(e.target.value)}
                  className="min-h-[200px] sm:min-h-[300px] resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                  readOnly={!generatedResume}
                />
                {generatedResume && (
                  <div className="flex flex-col sm:flex-row justify-end mt-6 space-y-3 sm:space-y-0 sm:space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setGeneratedResume('')}
                      className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 w-full sm:w-auto"
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedResume);
                        alert('Resume copied to clipboard!');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm w-full sm:w-auto"
                    >
                      Copy to Clipboard
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 