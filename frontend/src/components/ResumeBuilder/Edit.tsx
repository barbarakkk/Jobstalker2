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
    setSelectedTemplate,
    currentResumeId,
    setCurrentResumeId,
    loadResume,
    saveResume,
    updateResume,
    isDirty
  } = useResumeBuilder() as any;
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  
  // Load font settings from localStorage or use defaults
  const loadFontSettings = () => {
    try {
      const saved = localStorage.getItem(`resume-font-settings-${currentResumeId || 'default'}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load font settings:', e);
    }
    return {};
  };
  
  const [fontSettings, setFontSettings] = useState<{
    headerFont?: string;
    bodyFont?: string;
    fontSize?: number;
  }>(loadFontSettings());

  // Save font settings to localStorage when they change
  useEffect(() => {
    if (currentResumeId || Object.keys(fontSettings).length > 0) {
      try {
        localStorage.setItem(
          `resume-font-settings-${currentResumeId || 'default'}`,
          JSON.stringify(fontSettings)
        );
      } catch (e) {
        console.error('Failed to save font settings:', e);
      }
    }
  }, [fontSettings, currentResumeId]);
  
  // Get template ID from URL params or context, default to modern-professional
  const templateIdFromUrl = searchParams.get('template');
  const templateId = templateIdFromUrl || selectedTemplate || 'modern-professional';
  
  // Get resume ID from URL params
  const resumeIdFromUrl = searchParams.get('resume');

  // Set template from URL if provided
  useEffect(() => {
    if (templateIdFromUrl && templateIdFromUrl !== selectedTemplate) {
      console.log('Edit Page - Setting template from URL:', templateIdFromUrl);
      setSelectedTemplate(templateIdFromUrl);
    }
  }, [templateIdFromUrl, selectedTemplate, setSelectedTemplate]);

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
        <div className="flex items-center gap-2">
          {/* Subtle status chip for save state */}
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1 text-sm text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1 text-sm text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="inline-flex items-center gap-1 text-sm text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
              <AlertCircle className="h-4 w-4" />
              Save failed
            </span>
          )}
          {saveStatus === 'idle' && isDirty && (
            <span className="inline-flex items-center gap-1 text-sm text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              •
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
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
        <EditorToolbar 
          onReset={() => {
            setSelectedColor(null);
            setFontSettings({});
            window.location.reload();
          }}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          fontSettings={fontSettings}
          onFontSettingsChange={setFontSettings}
        />
        {/* Live Preview - Responsive */}
        <div className="bg-gray-50 p-4 rounded-lg border overflow-auto">
          <div className="mx-auto max-w-4xl resume-edit-container">
            <div className="bg-white rounded-md border border-gray-200 shadow-sm">
              <div 
                className="p-6" 
                key={`resume-${resumeData?.personalInfo?.email || 'default'}-${resumeData?.summary?.length || 0}-${templateId}-${selectedColor}-${fontSettings.bodyFont}-${fontSettings.headerFont}-${fontSettings.fontSize}`}
                style={{
                  fontFamily: fontSettings.bodyFont || undefined,
                  fontSize: fontSettings.fontSize ? `${fontSettings.fontSize}px` : undefined,
                }}
              >
                {resumeData && (
                  <TemplateRenderer 
                    templateId={templateId}
                    data={resumeData}
                    overridePrimaryColor={selectedColor || undefined}
                    overrideFontFamily={fontSettings.bodyFont}
                    overrideHeaderFont={fontSettings.headerFont}
                    overrideFontSize={fontSettings.fontSize}
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


