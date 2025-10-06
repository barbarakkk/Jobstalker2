import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, X, Save, Plus } from 'lucide-react';
import { Job, CreateJobData, UpdateJobData } from '@/lib/types';
import { jobApi } from '@/lib/api';

interface JobFormProps {
  job?: Job;
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: Job) => void;
}

export function JobForm({ job, isOpen, onClose, onSave }: JobFormProps) {
  const [formData, setFormData] = useState<CreateJobData>({
    job_title: '',
    company: '',
    location: '',
    salary: '',
    job_url: '',
    status: 'Bookmarked',
    excitement_level: 3,
    date_applied: '',
    deadline: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (job) {
      setFormData({
        job_title: job.job_title || '',
        company: job.company || '',
        location: job.location || '',
        salary: job.salary || '',
        job_url: job.job_url || '',
        status: job.status || 'Bookmarked',
        excitement_level: job.excitement_level || 3,
        date_applied: job.date_applied || '',
        deadline: job.deadline || '',
        description: job.description || '',
      });
    } else {
      setFormData({
        job_title: '',
        company: '',
        location: '',
        salary: '',
        job_url: '',
        status: 'Bookmarked',
        excitement_level: 3,
        date_applied: '',
        deadline: '',
        description: '',
      });
    }
  }, [job]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let savedJob: Job;
      
      if (job?.id) {
        // Update existing job
        savedJob = await jobApi.updateJob(job.id, formData as UpdateJobData);
      } else {
        // Create new job
        savedJob = await jobApi.createJob(formData);
      }
      
      onSave(savedJob);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-6 h-6 cursor-pointer transition-colors ${
          i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
        onClick={() => setFormData(prev => ({ ...prev, excitement_level: i + 1 }))}
      />
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            {job ? 'Edit Job' : 'Add New Job'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Job Title & Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.job_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Tech Corp"
                />
              </div>
            </div>

            {/* Location & Salary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary
                </label>
                <input
                  type="text"
                  value={formData.salary || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., $120,000"
                />
              </div>
            </div>

            {/* Job URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job URL
              </label>
                              <input
                  type="url"
                  value={formData.job_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, job_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <div className="flex flex-wrap gap-2">
                {['Bookmarked', 'Applying', 'Applied', 'Interviewing', 'Accepted'].map((status) => (
                  <Badge
                    key={status}
                    className={`cursor-pointer px-3 py-1 ${
                      formData.status === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, status: status as any }))}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Excitement Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excitement Level
              </label>
              <div className="flex items-center space-x-2">
                {renderStars(formData.excitement_level || 3)}
                <span className="text-sm text-gray-600 ml-2">
                  {formData.excitement_level}/5
                </span>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Applied
                </label>
                <input
                  type="date"
                  value={formData.date_applied || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_applied: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <div className="rounded-lg border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-shadow">
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg outline-none resize-y min-h-[100px]"
                  placeholder="Jot down interview prep, contacts, follow-ups, or anything relevant..."
                />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-gray-500">These notes are private to you.</span>
                <span className="text-xs text-gray-400">{(formData.description || '').length} chars</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    {job ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{job ? 'Update Job' : 'Add Job'}</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 