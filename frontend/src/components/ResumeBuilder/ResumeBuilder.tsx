import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, FilePlus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ResumeBuilder() {
  const [jobDescription, setJobDescription] = useState('');
  const [currentResume, setCurrentResume] = useState('');
  const [generatedResume, setGeneratedResume] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">JS</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">JobStalker</h1>
                <p className="text-sm text-gray-600 font-medium">Job Tracking Made Simple</p>
              </div>
            </div>
            <nav className="flex items-center space-x-8">
              <a 
                href="/dashboard" 
                className="text-muted-foreground hover:text-blue-600 transition-colors font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/dashboard');
                }}
              >
                Jobs
              </a>
              <a 
                href="/statistics" 
                className="text-muted-foreground hover:text-blue-600 transition-colors font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/statistics');
                }}
              >
                Statistics
              </a>
              <a href="#" className="text-muted-foreground hover:text-blue-600 transition-colors font-medium">Job Matcher</a>
              <a href="#" className="text-blue-600 font-semibold relative group">
                AI Resume Builder
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-blue-600 transition-colors font-medium">Profile</a>
            </nav>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Resume Builder</h1>
            <p className="text-gray-600 text-lg">
              Paste your resume and job description below to generate an ATS-optimized resume tailored for your application!
            </p>
          </div>

          <div className="space-y-6">
            {/* Job Description Section */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Job Description / Requirements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste the job description or requirements here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Only text is supported. Please copy and paste the job description here.
                </p>
              </CardContent>
            </Card>

            {/* Current Resume Section */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                                 <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                   <FilePlus className="w-5 h-5 text-blue-600" />
                   <span>Your Current Resume</span>
                 </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste your current resume here..."
                  value={currentResume}
                  onChange={(e) => setCurrentResume(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Only text is supported. Please copy and paste your resume here.
                </p>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleGenerateResume}
                disabled={isGenerating || !jobDescription.trim() || !currentResume.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold"
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Resume</span>
                  </div>
                )}
              </Button>
            </div>

            {/* Generated Resume Section */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Generated Resume</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="No resume generated yet. Enter your data and click 'Generate Resume'."
                  value={generatedResume}
                  onChange={(e) => setGeneratedResume(e.target.value)}
                  className="min-h-[300px] resize-none"
                  readOnly={!generatedResume}
                />
                {generatedResume && (
                  <div className="flex justify-end mt-4 space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setGeneratedResume('')}
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedResume);
                        alert('Resume copied to clipboard!');
                      }}
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