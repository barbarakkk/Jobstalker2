import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
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

  // Load job data when editing
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
    } else {
      // Reset form for add mode
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
      
      console.log('Calling onJobSaved with:', savedJob);
      onJobSaved(savedJob);
      console.log('Modal closing...');
      onClose();
    } catch (err) {
      console.error('Error saving job:', err);
      setError(err instanceof Error ? err.message : `Failed to ${mode} job`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {mode === 'edit' ? 'Edit Job' : 'Add New Job'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Fill out the form below to add a new job application to track.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Job Title and Company */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) => handleInputChange('job_title', e.target.value)}
                placeholder="Enter job title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Enter company name"
                required
              />
            </div>
          </div>

          {/* Location and Salary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                value={formData.salary || ''}
                onChange={(e) => handleInputChange('salary', e.target.value)}
                placeholder="Enter salary"
              />
            </div>
          </div>

          {/* Job URL */}
          <div className="space-y-2">
            <Label htmlFor="job_url">Job URL</Label>
            <Input
              id="job_url"
              value={formData.job_url || ''}
              onChange={(e) => handleInputChange('job_url', e.target.value)}
              placeholder="https://"
              type="url"
            />
          </div>

          {/* Status and Excitement Level */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                                <SelectItem value="Bookmarked">Bookmarked</SelectItem>
              <SelectItem value="Applying">Applying</SelectItem>
              <SelectItem value="Applied">Applied</SelectItem>
              <SelectItem value="Interviewing">Interviewing</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="excitement_level">Excitement Level</Label>
              <Select
                value={formData.excitement_level?.toString() || '3'}
                onValueChange={(value) => handleInputChange('excitement_level', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">⭐ 1 - Not excited</SelectItem>
                  <SelectItem value="2">⭐⭐ 2 - Somewhat interested</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ 3 - Interested</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ 4 - Very excited</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ 5 - Dream job!</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Applied and Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_applied">Date Applied</Label>
              <Input
                id="date_applied"
                type="date"
                value={formData.date_applied || ''}
                onChange={(e) => handleInputChange('date_applied', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline || ''}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add a job description..."
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (mode === 'edit' ? 'Updating...' : 'Adding...') : (mode === 'edit' ? 'Update Job' : 'Add Job')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 