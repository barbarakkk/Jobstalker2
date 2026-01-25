import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, FileText, Upload, Check, ArrowRight } from 'lucide-react';

interface MatchingMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMethodSelected: (method: 'profile' | 'resume') => void;
}

export function MatchingMethodModal({ isOpen, onClose, onMethodSelected }: MatchingMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'profile' | 'resume' | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMethodSelect = (method: 'profile' | 'resume') => {
    setSelectedMethod(method);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF or Word document');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleContinue = async () => {
    if (!selectedMethod) return;

    if (selectedMethod === 'resume' && !resumeFile) {
      alert('Please upload your resume');
      return;
    }

    setIsProcessing(true);
    // TODO: Handle file upload or profile matching API call
    setTimeout(() => {
      setIsProcessing(false);
      onMethodSelected(selectedMethod);
    }, 1000);
  };

  const handleClose = () => {
    setSelectedMethod(null);
    setResumeFile(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-white border border-gray-200 max-h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="space-y-3 px-6 pt-6 pb-4 flex-shrink-0 border-b border-gray-200">
          <DialogTitle className="text-xl font-bold text-gray-900">
            Choose Matching Method
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Select how you'd like to match jobs - using your profile or by uploading a resume
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {/* Profile Option */}
            <Card
              className={`cursor-pointer transition-all duration-200 border-2 ${
                selectedMethod === 'profile'
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleMethodSelect('profile')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0 ${
                    selectedMethod === 'profile' ? 'bg-blue-600' : 'bg-blue-100'
                  }`}>
                    <User className={`w-6 h-6 ${selectedMethod === 'profile' ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        Use Profile Info
                      </h3>
                      {selectedMethod === 'profile' && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Match jobs based on your saved profile information including skills, work experience, and education.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">Skills</Badge>
                      <Badge variant="secondary" className="text-xs">Experience</Badge>
                      <Badge variant="secondary" className="text-xs">Education</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resume Upload Option */}
            <Card
              className={`cursor-pointer transition-all duration-200 border-2 ${
                selectedMethod === 'resume'
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleMethodSelect('resume')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0 ${
                    selectedMethod === 'resume' ? 'bg-blue-600' : 'bg-blue-100'
                  }`}>
                    <FileText className={`w-6 h-6 ${selectedMethod === 'resume' ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        Upload Resume
                      </h3>
                      {selectedMethod === 'resume' && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload your resume and let AI extract your skills, experience, and qualifications to find matching jobs.
                    </p>
                    
                    {selectedMethod === 'resume' && (
                      <div className="mt-4">
                        <label className="block">
                          <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                            <div className="text-center">
                              {resumeFile ? (
                                <div className="space-y-2">
                                  <FileText className="w-8 h-8 text-blue-600 mx-auto" />
                                  <p className="text-sm font-medium text-gray-900">{resumeFile.name}</p>
                                  <p className="text-xs text-gray-500">Click to change file</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                                  <p className="text-sm font-medium text-gray-600">
                                    Click to upload or drag and drop
                                  </p>
                                  <p className="text-xs text-gray-500">PDF or Word document (MAX. 5MB)</p>
                                </div>
                              )}
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileUpload}
                            />
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedMethod || isProcessing || (selectedMethod === 'resume' && !resumeFile)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? (
              'Processing...'
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



