import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/Layout/AppHeader';

export function ResumeFinalizePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppHeader active="resume" />
      <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Finalize Resume</h1>
        <Link to="/resume-builder/edit" className="text-blue-600">Edit</Link>
      </div>
      <div className="bg-white p-6 rounded-lg border mb-6">Full Preview (coming soon)</div>
      <div className="flex gap-3">
        <Button>Download PDF</Button>
        <Button variant="secondary">Save as Version</Button>
        <Button variant="outline">Create Another</Button>
      </div>
    </div>
    </div>
  );
}


