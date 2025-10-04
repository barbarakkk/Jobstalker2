import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Edit, Trash2, FileText } from 'lucide-react';
import { Job } from '@/lib/types';

interface KanbanBoardProps {
  jobs: Job[];
  onStatusUpdate: (jobId: string, newStatus: string) => void;
  onEditJob: (job: Job) => void;
  onDeleteJob: (job: Job) => void;
  onStarRatingUpdate: (jobId: string, newRating: number) => void;
  updatingJobId: string | null;
}

interface JobCardProps {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onStarRatingUpdate: (jobId: string, newRating: number) => void;
  updatingJobId: string | null;
  getStatusColor: (status: string) => string;
}

const JobCard: React.FC<JobCardProps> = ({ job, onEdit, onDelete, onStarRatingUpdate, updatingJobId, getStatusColor }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  const renderStars = (count: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onStarRatingUpdate(job.id, star)}
            disabled={updatingJobId === job.id}
            className={`p-1 rounded transition-colors ${
              star <= (job.excitement_level || 0)
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 hover:text-gray-400'
            } ${updatingJobId === job.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Star className={`w-3 h-3 ${star <= (job.excitement_level || 0) ? 'fill-current' : ''}`} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-xl border-2 p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 rotate-2 scale-105' : 'hover:scale-105'
      } ${getStatusColor(job.status)}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            {job.job_url ? (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-semibold text-blue-600 text-sm truncate hover:underline pr-10"
                title="Open original job posting"
              >
                {job.job_title}
              </a>
            ) : (
              <h3 className="block font-semibold text-gray-900 text-sm truncate pr-10">
                {job.job_title}
              </h3>
            )}
            <p className="text-gray-600 text-xs truncate">{job.company}</p>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`/jobs/${job.id}`, '_self')}
              className="h-6 w-6 p-0 hover:bg-gray-100"
              title="View details"
            >
              <FileText className="h-3 w-3 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(job)}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <Edit className="h-3 w-3 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(job)}
              className="h-6 w-6 p-0 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 text-red-600 hover:text-red-700" />
            </Button>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2">
          {job.location && (
            <div className="flex items-center text-xs text-gray-600">
              <span className="truncate">📍 {job.location}</span>
            </div>
          )}
          {job.salary && (
            <div className="flex items-center text-xs text-gray-600">
              <span className="truncate">💰 {job.salary}</span>
            </div>
          )}
          {job.deadline && (
            <div className="flex items-center text-xs text-gray-600">
              <span className="truncate">📅 Due: {job.deadline}</span>
            </div>
          )}
          {job.date_applied && (
            <div className="flex items-center text-xs text-gray-600">
              <span className="truncate">📝 Applied: {job.date_applied}</span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(job.status)}`}>
            {job.status}
          </Badge>
          <div className="flex items-center space-x-1">
            {renderStars(job.excitement_level || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

interface KanbanColumnProps {
  title: string;
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onStarRatingUpdate: (jobId: string, newRating: number) => void;
  updatingJobId: string | null;
  getStatusColor: (status: string) => string;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  jobs,
  onEdit,
  onDelete,
  onStarRatingUpdate,
  updatingJobId,
  getStatusColor,
}) => {
  const { setNodeRef } = useSortable({ id: title });

  const getColumnColor = (status: string) => {
    switch (status) {
      case 'Bookmarked':
        return 'bg-gray-50 border-gray-200';
      case 'Applying':
        return 'bg-yellow-50 border-yellow-200';
      case 'Applied':
        return 'bg-blue-50 border-blue-200';
      case 'Interviewing':
        return 'bg-pink-50 border-pink-200';
      case 'Accepted':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div ref={setNodeRef} className={`rounded-xl border-2 p-4 min-h-[600px] w-80 ${getColumnColor(title)}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-900">{title}</h3>
        <Badge variant="secondary" className="text-sm font-bold bg-white text-gray-700 px-3 py-1 rounded-full shadow-md">{jobs.length}</Badge>
      </div>

      <div className="space-y-3">
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-base font-medium">No jobs in this status</div>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={onEdit}
              onDelete={onDelete}
              onStarRatingUpdate={onStarRatingUpdate}
              updatingJobId={updatingJobId}
              getStatusColor={getStatusColor}
            />
          ))
        )}
      </div>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  jobs,
  onStatusUpdate,
  onEditJob,
  onDeleteJob,
  onStarRatingUpdate,
  updatingJobId,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [jobColumns, setJobColumns] = useState<Record<string, Job[]>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Move getStatusColor function to main component scope
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Bookmarked':
        return 'bg-white border-gray-300 text-gray-900 shadow-lg';
      case 'Applying':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900 shadow-lg';
      case 'Applied':
        return 'bg-blue-100 border-blue-300 text-blue-900 shadow-lg';
      case 'Interviewing':
        return 'bg-pink-100 border-pink-300 text-pink-900 shadow-lg';
      case 'Accepted':
        return 'bg-green-100 border-green-300 text-green-900 shadow-lg';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900 shadow-lg';
    }
  };

  // Organize jobs by status
  React.useEffect(() => {
    const columns: Record<string, Job[]> = {
      Bookmarked: [],
      Applying: [],
      Applied: [],
      Interviewing: [],
      Accepted: [],
    };

    jobs.forEach((job) => {
      if (columns[job.status]) {
        columns[job.status].push(job);
      }
    });

    setJobColumns(columns);
  }, [jobs]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) {
      console.log('No drop target found');
      return;
    }

    const jobId = active.id as string;
    const overId = over.id as string;

    console.log('Drag end:', { jobId, overId });

    const job = jobs.find((j) => j.id === jobId);
    if (!job) {
      console.log('Job not found:', jobId);
      return;
    }

    const allowedStatuses = ['Bookmarked', 'Applying', 'Applied', 'Interviewing', 'Accepted'];
    let newStatus: string | null = null;

    // Check if we're dropping on a column (status)
    if (allowedStatuses.includes(overId)) {
      newStatus = overId;
      console.log('Dropping on column:', newStatus);
    } else {
      // If dropping on another job, get the status of that job's column
      const targetJob = jobs.find((j) => j.id === overId);
      if (targetJob) {
        newStatus = targetJob.status;
        console.log('Dropping on job, using target status:', newStatus);
      }
    }

    // Only update if we have a valid new status and it's different from current
    if (newStatus && job.status !== newStatus) {
      console.log('Updating job status from', job.status, 'to', newStatus);
      onStatusUpdate(jobId, newStatus);
    } else {
      console.log('No status update needed:', { currentStatus: job.status, newStatus });
    }
  };

  const activeJob = activeId ? jobs.find((job) => job.id === activeId) : null;

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-6 overflow-x-auto pb-4 justify-center">
          {Object.entries(jobColumns).map(([status, statusJobs]) => (
            <SortableContext key={status} items={statusJobs.map((job) => job.id)} strategy={verticalListSortingStrategy}>
              <KanbanColumn
                title={status}
                jobs={statusJobs}
                onEdit={onEditJob}
                onDelete={onDeleteJob}
                onStarRatingUpdate={onStarRatingUpdate}
                updatingJobId={updatingJobId}
                getStatusColor={getStatusColor}
              />
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeJob ? (
            <div className="bg-white rounded-xl border-2 border-gray-300 p-4 shadow-2xl opacity-90 scale-105">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{activeJob.job_title}</h3>
                    <p className="text-gray-600 text-xs truncate">{activeJob.company}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {activeJob.location && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="truncate">📍 {activeJob.location}</span>
                    </div>
                  )}
                  {activeJob.salary && (
                    <div className="flex items-center text-xs text-gray-600">
                      <span className="truncate">💰 {activeJob.salary}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Badge className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(activeJob.status)}`}>{activeJob.status}</Badge>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= (activeJob.excitement_level || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}; 