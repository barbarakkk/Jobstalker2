import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CreateJobData, Job } from '@/lib/types';
import { jobApi } from '@/lib/api';

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobSaved: (job: Job) => void;
  jobToEdit?: Job | null;
  mode: 'add' | 'edit';
}

export function JobModal({ isOpen, onClose, onJobSaved, jobToEdit, mode }: JobModalProps) {
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
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load job data when editing - only reset when modal opens/closes or mode changes
  useEffect(() => {
    if (mode === 'edit' && jobToEdit) {
      setFormData({
        job_title: jobToEdit.job_title || '',
        company: jobToEdit.company || '',
        location: jobToEdit.location || '',
        salary: jobToEdit.salary || '',
        job_url: jobToEdit.job_url || '',
        status: jobToEdit.status || 'Bookmarked',
        excitement_level: jobToEdit.excitement_level || 3,
        date_applied: jobToEdit.date_applied || '',
        deadline: jobToEdit.deadline || '',
        description: jobToEdit.description || ''
      });
    } else if (mode === 'add' && isOpen) {
      // Only reset form for add mode when modal is opened
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
        description: ''
      });
    }
  }, [mode, jobToEdit, isOpen]);

  const handleInputChange = (field: keyof CreateJobData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Clean up the data before sending - convert empty strings to null for optional fields
      const cleanedData = {
        ...formData,
        location: formData.location || null,
        salary: formData.salary || null,
        job_url: formData.job_url || null,
        date_applied: formData.date_applied || null,
        deadline: formData.deadline || null,
        description: formData.description || null,
        excitement_level: formData.excitement_level || null
      };

      console.log('Sending job data:', cleanedData);
      
      let savedJob: Job;
      if (mode === 'edit' && jobToEdit) {
        // Update existing job
        savedJob = await jobApi.updateJob(jobToEdit.id, cleanedData);
        console.log('Job updated successfully:', savedJob);
      } else {
        // Create new job
        savedJob = await jobApi.createJob(cleanedData);
        console.log('Job created successfully:', savedJob);
      }

      onJobSaved(savedJob);
    } catch (err) {
      console.error('Error saving job:', err);
      setError(err instanceof Error ? err.message : 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing modal
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
      description: ''
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-white border border-gray-200">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-bold text-gray-900">
            {mode === 'edit' ? 'Edit Job' : 'Add New Job'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {mode === 'edit' ? 'Update the job details below.' : 'Fill in the details for your new job application.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              </div>
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Title and Company */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job_title" className="text-sm font-semibold text-gray-900">Job Title</Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) => handleInputChange('job_title', e.target.value)}
                placeholder="Enter job title"
                required
                className="border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-semibold text-gray-900">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Enter company name"
                required
                className="border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Location and Salary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold text-gray-900">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter location"
                className="border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-sm font-semibold text-gray-900">Salary</Label>
              <Input
                id="salary"
                value={formData.salary || ''}
                onChange={(e) => handleInputChange('salary', e.target.value)}
                placeholder="Enter salary"
                className="border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Job URL */}
          <div className="space-y-2">
            <Label htmlFor="job_url" className="text-sm font-semibold text-gray-900">Job URL</Label>
            <Input
              id="job_url"
              value={formData.job_url || ''}
              onChange={(e) => handleInputChange('job_url', e.target.value)}
              placeholder="https://"
              type="url"
              className="border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
          </div>

          {/* Status and Excitement Level */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold text-gray-900">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value as any)}
              >
                <SelectTrigger className="border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="Bookmarked" className="hover:bg-gray-50 focus:bg-gray-50">Bookmarked</SelectItem>
                  <SelectItem value="Applying" className="hover:bg-gray-50 focus:bg-gray-50">Applying</SelectItem>
                  <SelectItem value="Applied" className="hover:bg-gray-50 focus:bg-gray-50">Applied</SelectItem>
                  <SelectItem value="Interviewing" className="hover:bg-gray-50 focus:bg-gray-50">Interviewing</SelectItem>
                  <SelectItem value="Accepted" className="hover:bg-gray-50 focus:bg-gray-50">Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="excitement_level" className="text-sm font-semibold text-gray-900">Excitement Level</Label>
              <Select
                value={formData.excitement_level?.toString() || '3'}
                onValueChange={(value) => handleInputChange('excitement_level', parseInt(value))}
              >
                <SelectTrigger className="border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="1" className="hover:bg-gray-50 focus:bg-gray-50">⭐ 1 - Not excited</SelectItem>
                  <SelectItem value="2" className="hover:bg-gray-50 focus:bg-gray-50">⭐⭐ 2 - Somewhat interested</SelectItem>
                  <SelectItem value="3" className="hover:bg-gray-50 focus:bg-gray-50">⭐⭐⭐ 3 - Interested</SelectItem>
                  <SelectItem value="4" className="hover:bg-gray-50 focus:bg-gray-50">⭐⭐⭐⭐ 4 - Very excited</SelectItem>
                  <SelectItem value="5" className="hover:bg-gray-50 focus:bg-gray-50">⭐⭐⭐⭐⭐ 5 - Dream job!</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Applied and Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_applied" className="text-sm font-semibold text-gray-900">Date Applied</Label>
              <Input
                id="date_applied"
                type="date"
                value={formData.date_applied || ''}
                onChange={(e) => handleInputChange('date_applied', e.target.value)}
                className="border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-sm font-semibold text-gray-900">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline || ''}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                className="border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-900">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add a job description..."
              rows={4}
              className="border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg px-6 py-3"
            >
              {loading ? (mode === 'edit' ? 'Updating...' : 'Adding...') : (mode === 'edit' ? 'Update Job' : 'Add Job')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 