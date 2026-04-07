import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects } from '../api/projects';
import { getSprints } from '../api/sprints';
import { getTasks, updateTask } from '../api/tasks';

import { KanbanSquare, Loader2, Calendar, Eye } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Card } from '../ui/Card';
import type { Task, UpdateTaskDto } from '../types';
import TaskModal from '../components/TaskModal';
import { toast } from 'react-hot-toast';

const SprintBoard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const { data: sprints } = useQuery({
    queryKey: ['sprints', selectedProjectId],
    queryFn: () => getSprints(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const activeSprint = sprints?.find(s => s.status === 'active') || sprints?.[0];

  const { data: tasks } = useQuery({
    queryKey: ['tasks', activeSprint?.id],
    queryFn: () => getTasks(activeSprint!.id),
    enabled: !!activeSprint?.id,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<Task> }) => updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', activeSprint?.id] });
      toast.success('Task updated successfully');
    },
    onError: () => toast.error('Failed to update task'),
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    
    if (result.source.droppableId !== destination.droppableId) {
       updateTaskMutation.mutate({ 
        taskId: draggableId, 
        data: { status: destination.droppableId as Task['status'] }
      });
    }
  };

  const columns: Record<Task['status'], Task[]> = {
    todo: tasks?.filter(t => t.status === 'todo') || [],
    in_progress: tasks?.filter(t => t.status === 'in_progress') || [],
    review: tasks?.filter(t => t.status === 'review') || [],
    done: tasks?.filter(t => t.status === 'done') || [],
  };

  const columnTitles: Record<Task['status'], string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'In Review',
    done: 'Done'
  };

  const columnColors: Record<Task['status'], string> = {
    todo: 'border-t-4 border-t-slate-300',
    in_progress: 'border-t-4 border-t-blue-400',
    review: 'border-t-4 border-t-amber-400',
    done: 'border-t-4 border-t-emerald-400',
  };

  if (projectsLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3">
            <KanbanSquare className="w-10 h-10 text-primary" /> Active Sprint Board
          </h1>
          <p className="text-slate-500 max-w-2xl text-lg font-medium">Manage and track your active sprints across all projects.</p>
        </div>
        <div>
          <select 
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold shadow-sm"
          >
            {projects?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!activeSprint && selectedProjectId && (
        <Card className="text-center p-12 border-dashed bg-slate-50">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold">No Active Sprint</h3>
          <p className="text-slate-500">Go to Project Details to create and start a sprint.</p>
        </Card>
      )}

      {activeSprint && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{activeSprint.name}</h3>
              <p className="text-slate-500 font-medium">
                {new Date(activeSprint.startDate).toLocaleDateString()} — {new Date(activeSprint.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Active
            </div>
          </div>

          <div className="overflow-x-auto pb-4">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-4 gap-6 min-w-[1200px]">
                 {(Object.keys(columns) as Array<Task['status']>).map(columnId => (
                  <Droppable key={columnId} droppableId={columnId}>
                     {(provided, snapshot) => (
                       <div
                         ref={provided.innerRef}
                         {...provided.droppableProps}
                         className={`p-4 rounded-2xl transition-colors duration-300 ${columnColors[columnId]} ${snapshot.isDraggingOver ? 'bg-primary/5' : 'bg-slate-50'}`}
                       >
                         <h4 className="text-lg font-black text-slate-700 flex items-center gap-2 mb-4">
                           {columnTitles[columnId]}
                           <span className="text-sm font-bold text-slate-400 bg-slate-200/80 px-2.5 py-1 rounded-lg">
                             {columns[columnId].length}
                           </span>
                         </h4>
                         <div className="space-y-4 min-h-[300px]">
                            {columns[columnId].map((task, index) => (
                              <TaskCard 
                                key={task.id}
                                task={task}
                                index={index}
                                onViewDetails={(t) => {
                                  setSelectedTask(t);
                                  setIsModalOpen(true);
                                }}
                              />
                            ))}
                            {provided.placeholder}
                         </div>
                       </div>
                     )}
                  </Droppable>
                 ))}
              </div>
            </DragDropContext>
          </div>
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => {
          if (selectedTask) {
            updateTaskMutation.mutate({ taskId: selectedTask.id, data: data as UpdateTaskDto });
          }
          setIsModalOpen(false);
        }}
        task={selectedTask}
        isCreating={false}
      />
    </div>
  );
};

/** 
 * Separate TaskCard component that handles the click vs. drag conflict.
 * Uses mouseDown/mouseUp position tracking to distinguish a click from a drag.
 */
interface TaskCardProps {
  task: Task;
  index: number;
  onViewDetails: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index, onViewDetails }) => {
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!mouseDownPos.current) return;
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    // If mouse barely moved, treat it as a click
    if (dx < 5 && dy < 5) {
      onViewDetails(task);
    }
    mouseDownPos.current = null;
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseDown={(e) => {
            handleMouseDown(e);
            // Don't block the DnD library's own handler
            (provided.dragHandleProps as any)?.onMouseDown?.(e);
          }}
          onMouseUp={handleMouseUp}
          className={`bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md cursor-pointer transition-all group ${snapshot.isDragging ? "rotate-3 shadow-2xl ring-2 ring-primary scale-105 z-50" : ""}`}
        >
          <div className="flex items-start justify-between mb-3">
            <span className={`px-2 py-1 text-[10px] font-black rounded-md uppercase ${
              task.priority === 'high' ? 'bg-red-100 text-red-700' :
              task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {task.priority}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(task);
              }}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-primary/10 text-slate-400 hover:text-primary transition-all"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <p className="font-bold text-slate-800 mb-2">{task.title}</p>
          {task.assignee && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black">
                {task.assignee.name.charAt(0)}
              </div>
              <span className="text-xs text-slate-400 font-medium">{task.assignee.name}</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default SprintBoard;
