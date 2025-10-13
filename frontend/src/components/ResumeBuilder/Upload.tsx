import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/Layout/AppHeader';

export function ResumeUploadPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const template = searchParams.get('template') || 'jsonresume-theme-modern';
  const [file, setFile] = useState<File | null>(null);

  const onContinue = () => {
    navigate(`/resume-builder/edit?template=${encodeURIComponent(template)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppHeader active="resume" />
      <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Upload Your Resume</h1>
        <div className="w-28 h-1.5 bg-blue-600 rounded mt-3" />
        <p className="text-sm text-gray-600 mt-3">Supported formats: <span className="font-semibold text-gray-800">PDF, DOCX, TXT</span> · Max size <span className="font-semibold text-gray-800">5MB</span></p>
      </div>

      <div className="rounded-xl border-2 border-dashed border-blue-200 bg-white shadow-sm p-10 text-center hover:border-blue-400 transition-colors">
        <div className="text-gray-700 font-medium">
          {file ? (
            <span className="text-blue-700 font-semibold">{file.name}</span>
          ) : (
            <>
              <span className="text-gray-500">Drag & drop your file here, or</span>{' '}
              <label className="text-blue-700 font-semibold cursor-pointer hover:underline">
                Choose File
                <input
                  className="hidden"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </>
          )}
        </div>
        <div className="mt-6">
          <Button className="px-6" disabled={!file} onClick={onContinue}>Continue to Edit</Button>
        </div>
      </div>
      </div>
    </div>
  );
}


