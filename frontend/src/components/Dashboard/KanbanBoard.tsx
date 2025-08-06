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
  arrayMove,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Edit, Trash2, MoreHorizontal } from 'lucide-react';
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
}

const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  onEdit, 
  onDelete, 
  onStarRatingUpdate, 
  updatingJobId 
}) => {
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
  };

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
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-300 hover:text-gray-400'
            } ${updatingJobId === job.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Star className={`w-3 h-3 ${star <= (job.excitement_level || 0) ? 'fill-current' : ''}`} />
          </button>
        ))}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Bookmarked':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Applying':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Applied':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Interviewing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Accepted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {job.job_title}
            </h3>
            <p className="text-gray-600 text-xs truncate">{job.company}</p>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(job)}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <Edit className="h-3 w-3 text-gray-500" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(job)}
              className="h-6 w-6 p-0 hover:bg-red-100"
            >
              <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-500" />
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
          <Badge className={`text-xs ${getStatusColor(job.status)}`}>
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
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  jobs,
  onEdit,
  onDelete,
  onStarRatingUpdate,
  updatingJobId,
}) => {
  const {
    setNodeRef,
  } = useSortable({ id: title });

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-50 rounded-lg p-4 min-h-[600px] w-80"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <Badge variant="secondary" className="text-xs">
          {jobs.length}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No jobs in this status
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={onEdit}
              onDelete={onDelete}
              onStarRatingUpdate={onStarRatingUpdate}
              updatingJobId={updatingJobId}
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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Organize jobs by status
  React.useEffect(() => {
    const columns: Record<string, Job[]> = {
      'Bookmarked': [],
      'Applying': [],
      'Applied': [],
      'Interviewing': [],
      'Accepted': [],
    };

    jobs.forEach((job) => {
      console.log('Job status:', job.status, 'Type:', typeof job.status);
      if (columns[job.status]) {
        columns[job.status].push(job);
      } else {
        console.warn('Unknown status:', job.status);
      }
    });

    console.log('Organized columns:', columns);
    setJobColumns(columns);
  }, [jobs]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const jobId = active.id as string;
    const overId = over.id as string;

    console.log('Drag end - jobId:', jobId, 'overId:', overId);

    // Find the job being dragged
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
      console.error('Job not found:', jobId);
      return;
    }

    // Check if we're dropping on a column (status) or another job
    const allowedStatuses = ['Bookmarked', 'Applying', 'Applied', 'Interviewing', 'Accepted'];
    let newStatus: string | null = null;

    if (allowedStatuses.includes(overId)) {
      // Dropping on a column
      newStatus = overId;
    } else {
      // Dropping on another job - find the status of that job
      const targetJob = jobs.find(j => j.id === overId);
      if (targetJob) {
        newStatus = targetJob.status;
      }
    }

    if (!newStatus) {
      console.error('Could not determine new status');
      return;
    }

    if (job.status === newStatus) {
      console.log('Status unchanged, skipping update');
      return;
    }

    console.log('Updating job status from', job.status, 'to', newStatus);
    // Update the job status
    onStatusUpdate(jobId, newStatus);
  };

  const activeJob = activeId ? jobs.find(job => job.id === activeId) : null;

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
            <SortableContext
              key={status}
              items={statusJobs.map(job => job.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn
                title={status}
                jobs={statusJobs}
                onEdit={onEditJob}
                onDelete={onDeleteJob}
                onStarRatingUpdate={onStarRatingUpdate}
                updatingJobId={updatingJobId}
              />
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeJob ? (
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-lg opacity-90">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {activeJob.job_title}
                    </h3>
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
                  <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                    {activeJob.status}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= (activeJob.excitement_level || 0)
                            ? 'text-yellow-500 fill-current'
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