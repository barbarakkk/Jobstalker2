import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, FilePlus, Sparkles, ArrowLeft, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

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
    <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
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
                className="text-muted-foreground hover:text-primary transition-colors font-medium relative group"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/dashboard');
                }}
              >
                Jobs
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a 
                href="/statistics" 
                className="text-muted-foreground hover:text-primary transition-colors font-medium relative group"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/statistics');
                }}
              >
                Statistics
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#" className="text-primary font-semibold relative group">
                AI Resume Builder
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium relative group">
                Profile
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <ThemeToggle />
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                className="p-2 rounded-lg hover:bg-accent transition-colors relative z-50"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-foreground" />
                ) : (
                  <Menu className="w-5 h-5 text-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <nav className="mt-4 pb-4 border-t border-border bg-card rounded-lg shadow-lg">
              <div className="flex flex-col space-y-1 pt-4 px-4">
                <a 
                  href="/dashboard" 
                  className="text-foreground hover:text-primary transition-colors font-medium py-3 px-4 rounded-lg hover:bg-accent flex items-center space-x-3 group"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/dashboard');
                    closeMobileMenu();
                  }}
                >
                  <div className="w-2 h-2 bg-muted-foreground rounded-full group-hover:bg-primary transition-colors"></div>
                  <span>Jobs Dashboard</span>
                </a>
                <a 
                  href="/statistics" 
                  className="text-foreground hover:text-primary transition-colors font-medium py-3 px-4 rounded-lg hover:bg-accent flex items-center space-x-3 group"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/statistics');
                    closeMobileMenu();
                  }}
                >
                  <div className="w-2 h-2 bg-muted-foreground rounded-full group-hover:bg-primary transition-colors"></div>
                  <span>Statistics</span>
                </a>
                <a 
                  href="#" 
                  className="text-primary font-semibold py-3 px-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center space-x-3"
                >
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>AI Resume Builder</span>
                </a>
                <a 
                  href="#" 
                  className="text-foreground hover:text-primary transition-colors font-medium py-3 px-4 rounded-lg hover:bg-accent flex items-center space-x-3 group"
                >
                  <div className="w-2 h-2 bg-muted-foreground rounded-full group-hover:bg-primary transition-colors"></div>
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
                className="text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground px-4">AI Resume Builder</h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Paste your resume and job description below to generate an ATS-optimized resume tailored for your application.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {/* Job Description Section */}
            <Card className="bg-card border border-border shadow-sm">
              <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
                <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl font-semibold text-foreground">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <span>Job Description / Requirements</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Paste the job description or requirements to help optimize your resume.
                </p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <Textarea
                  placeholder="Paste the job description or requirements here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[150px] sm:min-h-[200px] resize-none border-border focus:border-primary focus:ring-primary text-sm sm:text-base bg-background text-foreground"
                />
                <p className="text-sm text-muted-foreground mt-3">
                  Only text is supported. Please copy and paste the job description here.
                </p>
              </CardContent>
            </Card>

            {/* Current Resume Section */}
            <Card className="bg-card border border-border shadow-sm">
              <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
                <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl font-semibold text-foreground">
                  <FilePlus className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <span>Your Current Resume</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Paste your current resume content to be enhanced by our AI.
                </p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <Textarea
                  placeholder="Paste your current resume here..."
                  value={currentResume}
                  onChange={(e) => setCurrentResume(e.target.value)}
                  className="min-h-[150px] sm:min-h-[200px] resize-none border-border focus:border-primary focus:ring-primary text-sm sm:text-base bg-background text-foreground"
                />
                <p className="text-sm text-muted-foreground mt-3">
                  Only text is supported. Please copy and paste your resume here.
                </p>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleGenerateResume}
                disabled={isGenerating || !jobDescription.trim() || !currentResume.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-lg px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
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
            <Card className="bg-card border border-border shadow-sm">
              <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
                <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl font-semibold text-foreground">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <span>Generated Resume</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Your AI-enhanced resume optimized for the job description.
                </p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <Textarea
                  placeholder="No resume generated yet. Enter your data and click 'Generate Resume' above."
                  value={generatedResume}
                  onChange={(e) => setGeneratedResume(e.target.value)}
                  className="min-h-[200px] sm:min-h-[300px] resize-none border-border focus:border-primary focus:ring-primary text-sm sm:text-base bg-background text-foreground"
                  readOnly={!generatedResume}
                />
                {generatedResume && (
                  <div className="flex flex-col sm:flex-row justify-end mt-6 space-y-3 sm:space-y-0 sm:space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setGeneratedResume('')}
                      className="border-border text-foreground hover:bg-accent hover:border-border/80 w-full sm:w-auto"
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedResume);
                        alert('Resume copied to clipboard!');
                      }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm w-full sm:w-auto"
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