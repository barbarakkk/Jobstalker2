import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useResumeBuilder } from '@/components/ResumeBuilder/context/ResumeBuilderContext';
import { AppHeader } from '@/components/Layout/AppHeader';
import { EditorToolbar } from '@/components/ResumeBuilder/EditorToolbar';
import { TemplateRenderer } from '@/components/ResumeBuilder/Templates/TemplateRenderer';
import { Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function ResumeEditPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useLocation() as any;
  const { 
    resumeData, 
    replaceResumeData, 
    selectedTemplate,
    currentResumeId,
    setCurrentResumeId,
    loadResume,
    saveResume,
    updateResume,
    isDirty
  } = useResumeBuilder() as any;
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Get template ID from URL params or context, default to modern-professional
  const templateId = searchParams.get('template') || selectedTemplate || 'modern-professional';
  
  // Get resume ID from URL params
  const resumeIdFromUrl = searchParams.get('resume');

  // Load resume if ID is in URL and not already loaded
  useEffect(() => {
    if (resumeIdFromUrl && resumeIdFromUrl !== currentResumeId) {
      console.log('Edit Page - Loading resume from URL:', resumeIdFromUrl);
      loadResume(resumeIdFromUrl).catch((error: unknown) => {
        console.error('Error loading resume:', error);
      });
    }
  }, [resumeIdFromUrl, currentResumeId, loadResume]);

  // If navigation provided fresh data, hydrate context once
  useEffect(() => {
    if (state?.injectedResumeData) {
      console.log('Edit Page - Injecting fresh resume data from navigation:', state.injectedResumeData);
      replaceResumeData(state.injectedResumeData);
      // clear state reference so we do not loop
      state.injectedResumeData = undefined;
    }
  }, [state?.injectedResumeData, replaceResumeData]);

  const handleAutoSave = async () => {
    if (!currentResumeId || !resumeData) return;

    try {
      await updateResume(currentResumeId, undefined, resumeData);
      console.log('Edit Page - Auto-saved resume');
    } catch (error) {
      console.error('Error auto-saving resume:', error);
    }
  };

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (isDirty && currentResumeId && resumeData) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 30000); // Auto-save after 30 seconds of inactivity

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, currentResumeId]);

  const handleManualSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');

    try {
      if (currentResumeId) {
        // Update existing resume
        await updateResume(currentResumeId, undefined, resumeData);
        setSaveStatus('saved');
      } else {
        // Save new resume
        const savedId = await saveResume(
          `Resume - ${new Date().toLocaleDateString()}`,
          templateId,
          resumeData
        );
        setCurrentResumeId(savedId);
        setSaveStatus('saved');
        // Update URL with resume ID
        navigate(`/resume-builder/edit?resume=${savedId}&template=${encodeURIComponent(templateId)}`, { replace: true });
      }
      
      // Clear save status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving resume:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppHeader active="resume" />
      <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Resume</h1>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleManualSave}
            disabled={isSaving || !resumeData}
            className="flex items-center gap-2"
            variant={saveStatus === 'saved' ? 'default' : saveStatus === 'error' ? 'destructive' : 'default'}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Saved
              </>
            ) : saveStatus === 'error' ? (
              <>
                <AlertCircle className="h-4 w-4" />
                Error
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
          <Button onClick={() => navigate('/resume-builder/finalize')}>Finalize</Button>
        </div>
      </div>
      <div className="space-y-4">
        <EditorToolbar onReset={() => window.location.reload()} />
        {/* Live Preview - Responsive */}
        <div className="bg-gray-100 p-4 rounded-lg border overflow-auto relative">
          {/* Edit Mode Indicator */}
          <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
            Edit Mode: ON
          </div>
          
          <div className="mx-auto max-w-4xl resume-edit-container">
            <div className="bg-white rounded-md border border-gray-300 shadow">
              <div className="p-6" key={`resume-${resumeData?.personalInfo?.email || 'default'}-${resumeData?.summary?.length || 0}-${templateId}`}>
                {resumeData && (
                  <TemplateRenderer 
                    templateId={templateId}
                    data={resumeData}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}


