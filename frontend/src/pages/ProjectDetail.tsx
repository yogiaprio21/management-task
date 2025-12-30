import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject } from '../api/projects';
import { getBacklogItems, createBacklogItem, updateBacklogItem, deleteBacklogItem } from '../api/backlog';
import { getSprints, createSprint } from '../api/sprints';
import { getReports, createReport } from '../api/reports';
import { getTasks, updateTask, deleteTask } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutList, 
  KanbanSquare, 
  BarChart3, 
  Plus, 
  Calendar, 
  MoreVertical,
  AlertCircle,
  Trash2,
  Pencil,
  X,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import clsx from 'clsx';
import type { 
  CreateBacklogDto, 
  CreateSprintDto, 
  CreateReportDto,
  BacklogItem,
  Report
} from '../types';
import type { Sprint, Task } from '../types';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'backlog' | 'board' | 'reports'>('backlog');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // --- Queries ---
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id!),
    enabled: !!id,
  });

  const { data: backlogItems, isLoading: backlogLoading } = useQuery({
    queryKey: ['backlog', id],
    queryFn: () => getBacklogItems(id!),
    enabled: !!id && activeTab === 'backlog',
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mutate: _updateBacklog } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBacklogDto> }) => 
      updateBacklogItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog', id] });
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mutate: _deleteBacklog } = useMutation({
    mutationFn: deleteBacklogItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog', id] });
      toast.success('Backlog item deleted');
    }
  });

  const { data: sprints, isLoading: sprintsLoading } = useQuery({
    queryKey: ['sprints', id],
    queryFn: () => getSprints(id!),
    enabled: !!id && activeTab === 'board',
  });
  
  // Assuming we show tasks for the first active sprint for now
  const activeSprint = sprints?.find(s => s.status === 'active') || sprints?.[0];
  
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', activeSprint?.id],
    queryFn: () => getTasks(activeSprint!.id),
    enabled: !!activeSprint?.id && activeTab === 'board',
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', id],
    queryFn: () => getReports(id!),
    enabled: !!id && activeTab === 'reports',
  });

  // --- Mutations ---
  const createBacklogMutation = useMutation({
    mutationFn: createBacklogItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog', id] });
      toast.success('Backlog item added');
    }
  });

  const createSprintMutation = useMutation({
    mutationFn: (data: CreateSprintDto) => createSprint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', id] });
      toast.success('Sprint created');
    }
  });

  const createReportMutation = useMutation({
    mutationFn: (data: CreateReportDto) => createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', id] });
      toast.success('Report created');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<Task> }) => 
      updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', activeSprint?.id] });
      toast.success('Task updated');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', activeSprint?.id] });
      toast.success('Task deleted');
    }
  });

  // --- Drag and Drop ---
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    
    // RBAC Check for moving tasks
    // Everyone can move tasks in Kanban usually, but if strict:
    // Team Member: only update assigned task.
    // Let's assume Drag & Drop is allowed but backend will reject if unauthorized.
    // However, for better UX, we could check here.
    
    if (result.source.droppableId !== destination.droppableId) {
       updateTaskMutation.mutate({ 
        taskId: draggableId, 
        data: { status: destination.droppableId as Task['status'] }
      });
    }
  };
  
  const canManageProject = (): boolean => {
    return user?.role === 'admin' || (!!project && user?.id === project.ownerId);
  };

  if (projectLoading) return <div className="p-8">Loading project...</div>;
  if (!project) return <div className="p-8">Project not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        <p className="text-gray-500">{project.description}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('backlog')}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors',
              activeTab === 'backlog' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <LayoutList className="w-4 h-4" />
            Backlog
          </button>
          <button
            onClick={() => setActiveTab('board')}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors',
              activeTab === 'board' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <KanbanSquare className="w-4 h-4" />
            Active Sprint
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors',
              activeTab === 'reports' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Reports
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'backlog' && (
          <BacklogView 
            items={backlogItems || []} 
            isLoading={backlogLoading}
            projectId={id!}
            onCreate={(data) => createBacklogMutation.mutate({ ...data, projectId: id! })}
            canCreate={canManageProject()}
          />
        )}
        
        {activeTab === 'board' && (
          <BoardView 
            sprint={activeSprint}
            tasks={tasks || []}
            isLoading={sprintsLoading || tasksLoading}
            onDragEnd={onDragEnd}
            onStartSprint={() => {
              // TODO: Implement start sprint logic (update sprint status)
              toast('Start Sprint feature coming soon!', { icon: '🚀' });
            }}
            onCreateSprint={(data) => createSprintMutation.mutate({ ...data, projectId: id! })}
            canManageSprint={canManageProject()}
            onUpdateTask={(id, data) => updateTaskMutation.mutate({ taskId: id, data })}
            onDeleteTask={(id) => deleteTaskMutation.mutate(id)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView 
            reports={reports || []}
            isLoading={reportsLoading}
            onCreate={(data) => createReportMutation.mutate({ ...data, projectId: id! })}
          />
        )}
      </div>
    </div>
  );
};

// --- Sub-Components ---

const BacklogView: React.FC<{
  items: BacklogItem[];
  isLoading: boolean;
  projectId: string;
  onCreate: (data: Omit<CreateBacklogDto, 'projectId'>) => void;
  canCreate: boolean;
}> = ({ items, isLoading, onCreate, canCreate }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ title, description: '', priority });
    setTitle('');
    setIsCreating(false);
  };

  if (isLoading) return <div>Loading backlog...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Backlog Items</h3>
        {canCreate && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="What needs to be done?"
              className="flex-1 px-3 py-2 border rounded-md"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
            <select 
              value={priority}
              onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="px-3 py-2 border rounded-md"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Save</button>
            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-2 h-2 rounded-full",
                item.priority === 'high' ? 'bg-red-500' : 
                item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              )} />
              <span className="font-medium text-gray-700">{item.title}</span>
            </div>
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full capitalize">{item.status}</span>
          </div>
        ))}
        {items.length === 0 && !isCreating && (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            No items in backlog
          </div>
        )}
      </div>
    </div>
  );
};

const BoardView: React.FC<{
  sprint: Sprint | undefined;
  tasks: Task[];
  isLoading: boolean;
  onDragEnd: (result: DropResult) => void;
  onStartSprint: () => void;
  onCreateSprint: (data: Omit<CreateSprintDto, 'projectId'>) => void;
  canManageSprint: boolean;
  onUpdateTask: (id: string, data: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}> = ({ sprint, tasks, isLoading, onDragEnd, onStartSprint, onCreateSprint, canManageSprint, onUpdateTask, onDeleteTask }) => {
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateSprint({
      name: sprintName,
      startDate,
      endDate,
    });
    setIsCreatingSprint(false);
    setSprintName('');
    setStartDate('');
    setEndDate('');
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
  };

  const handleSaveEdit = (taskId: string) => {
    onUpdateTask(taskId, { title: editTitle });
    setEditingTaskId(null);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle('');
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDeleteTask(taskId);
    }
  };

  if (isLoading) return <div>Loading board...</div>;
  
  if (!sprint) return (
    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900">No Active Sprint</h3>
      <p className="text-gray-500 mb-6">Start a sprint to see the task board.</p>
      
      {canManageSprint && !isCreatingSprint ? (
        <button 
          onClick={() => setIsCreatingSprint(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600"
        >
          <Calendar className="w-4 h-4" /> Create New Sprint
        </button>
      ) : isCreatingSprint ? (
        <form onSubmit={handleCreateSprint} className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-left">
          <h4 className="font-semibold mb-4">New Sprint Details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sprint Name</label>
              <input 
                type="text" 
                required
                className="w-full px-3 py-2 border rounded-lg"
                value={sprintName}
                onChange={e => setSprintName(e.target.value)}
                placeholder="Sprint 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-blue-600">Create Sprint</button>
              <button type="button" onClick={() => setIsCreatingSprint(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-gray-400 italic">You do not have permission to create sprints.</div>
      )}
    </div>
  );

  const columns: Record<Task['status'], Task[]> = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    done: tasks.filter(t => t.status === 'done'),
  };

  const columnTitles: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{sprint.name}</h3>
          <p className="text-sm text-gray-500">
            {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
          </p>
        </div>
        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-2">
          Active
          {canManageSprint && (
            <button onClick={onStartSprint} title="Sprint Options">
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-300px)] overflow-x-auto">
          {(Object.keys(columns) as Array<keyof typeof columns>).map(colId => (
            <div key={colId} className="flex flex-col bg-gray-50 rounded-xl p-4 min-w-[280px]">
              <h4 className="font-semibold text-gray-700 mb-4 flex items-center justify-between">
                {columnTitles[colId]}
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {columns[colId].length}
                </span>
              </h4>
              
              <Droppable droppableId={colId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={clsx(
                      "flex-1 space-y-3 transition-colors rounded-lg",
                      snapshot.isDraggingOver ? "bg-blue-50" : ""
                    )}
                  >
                    {columns[colId].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={clsx(
                              "bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all group",
                              snapshot.isDragging ? "rotate-2 shadow-lg ring-2 ring-primary ring-opacity-50" : ""
                            )}
                          >
                            {editingTaskId === task.id ? (
                              <div className="mb-2">
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-sm mb-2"
                                  autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => handleSaveEdit(task.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                                  <button onClick={handleCancelEdit} className="p-1 text-gray-500 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-start mb-2 gap-2">
                                <h5 className="font-medium text-gray-900 break-words flex-1">{task.title}</h5>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleStartEdit(task)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-3">
                               <div className={clsx(
                                "w-2 h-2 rounded-full",
                                task.priority === 'high' ? 'bg-red-500' : 
                                task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              )} />
                              {task.assignee && (
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold" title={task.assignee.name}>
                                  {task.assignee.name.charAt(0)}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

const ReportsView: React.FC<{
  reports: Report[];
  isLoading: boolean;
  onCreate: (data: Omit<CreateReportDto, 'projectId'>) => void;
}> = ({ reports, isLoading, onCreate }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState<'daily' | 'weekly'>('daily');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ content, type });
    setContent('');
    setIsCreating(false);
  };

  if (isLoading) return <div>Loading reports...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Project Reports</h3>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" /> Create Report
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="type" 
                  value="daily" 
                  checked={type === 'daily'} 
                  onChange={() => setType('daily')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Daily Standup</span>
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="type" 
                  value="weekly" 
                  checked={type === 'weekly'} 
                  onChange={() => setType('weekly')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Weekly Summary</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea 
              required
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              placeholder={type === 'daily' ? "What did you do yesterday? What will you do today? Any blockers?" : "Summary of the week's progress..."}
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save Report</button>
            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className={clsx(
                "px-2 py-1 text-xs font-medium rounded-full uppercase",
                report.type === 'daily' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              )}>
                {report.type}
              </span>
              <span className="text-sm text-gray-400">
                {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{report.content}</p>
          </div>
        ))}
        {reports.length === 0 && (
           <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            No reports available
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
