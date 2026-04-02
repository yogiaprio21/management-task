import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject, addProjectMember, removeProjectMember } from '../api/projects';
import { getBacklogItems, createBacklogItem } from '../api/backlog';
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
  Users,
  UserPlus,
  Mail,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import type { 
  CreateBacklogDto, 
  CreateSprintDto, 
  CreateReportDto,
  BacklogItem,
  Report,
  User,
  Sprint,
  Task
} from '../types';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'backlog' | 'board' | 'reports' | 'members'>('backlog');
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

  const { data: sprints, isLoading: sprintsLoading } = useQuery({
    queryKey: ['sprints', id],
    queryFn: () => getSprints(id!),
    enabled: !!id && activeTab === 'board',
  });
  
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
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', activeSprint?.id] });
      toast.success('Task deleted');
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: (email: string) => addProjectMember(id!, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Member added successfully');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeProjectMember(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Member removed');
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

  if (projectLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-slate-500 font-medium">Loading project details...</p>
    </div>
  );

  if (!project) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <h3 className="text-xl font-bold text-slate-900">Project not found</h3>
      <Button variant="secondary" onClick={() => window.history.back()}>Go Back</Button>
    </div>
  );

  const tabs = [
    { id: 'backlog', label: 'Backlog', icon: LayoutList },
    { id: 'board', label: 'Active Sprint', icon: KanbanSquare },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'members', label: 'Members', icon: Users },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{project.name}</h1>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
              {project.owner?.name}'s Project
            </span>
          </div>
          <p className="text-slate-500 max-w-2xl text-lg font-medium">{project.description}</p>
        </div>
        
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
          <Calendar className="w-4 h-4" />
          Created {new Date(project.createdAt).toLocaleDateString()}
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm inline-flex w-full md:w-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200
                ${isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-[500px]"
      >
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
            onStartSprint={() => toast('Start Sprint feature coming soon!', { icon: '🚀' })}
            onCreateSprint={(data) => createSprintMutation.mutate({ ...data, projectId: id! })}
            canManageSprint={canManageProject()}
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

        {activeTab === 'members' && (
          <MembersView 
            members={project.members || []}
            ownerId={project.ownerId}
            onAdd={(email) => addMemberMutation.mutate(email)}
            onRemove={(userId) => removeMemberMutation.mutate(userId)}
            canManage={canManageProject()}
            isAdding={addMemberMutation.isPending}
          />
        )}
      </motion.div>
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
    if (!title.trim()) return;
    onCreate({ title, description: '', priority });
    setTitle('');
    setIsCreating(false);
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-slate-900">Backlog Items</h3>
        {canCreate && (
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-slate-50 border-slate-200">
              <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                <Input 
                  placeholder="What needs to be done?"
                  className="flex-1"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  autoFocus
                />
                <select 
                  value={priority}
                  onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <div className="flex gap-2">
                  <Button type="submit">Save Item</Button>
                  <Button variant="ghost" type="button" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-3">
        {items.map((item, index) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={item.id}
          >
            <Card className="py-4 px-6 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full shadow-sm ${
                  item.priority === 'high' ? 'bg-red-500' : 
                  item.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <span className="font-bold text-slate-700">{item.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                  item.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                  item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.status}
                </span>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
        {items.length === 0 && !isCreating && (
          <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
            <LayoutList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-slate-500 font-bold">No backlog items yet</h4>
            <p className="text-slate-400 text-sm">Start by adding your first task to the backlog.</p>
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
  onDeleteTask: (id: string) => void;
}> = ({ sprint, tasks, isLoading, onDragEnd, onStartSprint, onCreateSprint, canManageSprint, onDeleteTask }) => {
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateSprint({ name: sprintName, startDate, endDate });
    setIsCreatingSprint(false);
    setSprintName(''); setStartDate(''); setEndDate('');
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;
  
  if (!sprint) return (
    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 max-w-2xl mx-auto">
      <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-6" />
      <h3 className="text-2xl font-bold text-slate-900 mb-2">No Active Sprint</h3>
      <p className="text-slate-500 mb-8 font-medium">Create a sprint to start organizing your work in the Kanban board.</p>
      
      {canManageSprint && !isCreatingSprint ? (
        <Button onClick={() => setIsCreatingSprint(true)} size="lg" className="gap-2">
          <Plus className="w-5 h-5" /> Create New Sprint
        </Button>
      ) : isCreatingSprint ? (
        <Card className="max-w-md mx-auto text-left shadow-2xl border-none">
          <h4 className="text-xl font-bold mb-6">Sprint Configuration</h4>
          <form onSubmit={handleCreateSprint} className="space-y-5">
            <Input 
              label="Sprint Name"
              required
              value={sprintName}
              onChange={e => setSprintName(e.target.value)}
              placeholder="e.g. Q1 Sprint 1"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date" type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} />
              <Input label="End Date" type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">Start Planning</Button>
              <Button variant="secondary" type="button" onClick={() => setIsCreatingSprint(false)} className="flex-1">Cancel</Button>
            </div>
          </form>
        </Card>
      ) : (
        <p className="text-slate-400 italic">Only project owners can manage sprints.</p>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">{sprint.name}</h3>
          <p className="text-slate-500 font-medium">
            {new Date(sprint.startDate).toLocaleDateString()} — {new Date(sprint.endDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Active
          </div>
          {canManageSprint && (
            <Button variant="secondary" size="sm" onClick={onStartSprint}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide min-h-[600px]">
          {(Object.keys(columns) as Array<keyof typeof columns>).map(colId => (
            <div key={colId} className="flex flex-col bg-slate-100/50 rounded-2xl p-4 min-w-[300px] border border-slate-200/50">
              <div className="flex items-center justify-between mb-4 px-2">
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                  {columnTitles[colId]}
                  <span className="bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                    {columns[colId].length}
                  </span>
                </h4>
              </div>
              
              <Droppable droppableId={colId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-4 transition-all duration-200 rounded-xl p-1 ${
                      snapshot.isDraggingOver ? "bg-primary/5 ring-2 ring-primary/20 ring-inset" : ""
                    }`}
                  >
                    {columns[colId].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`
                              bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group
                              ${snapshot.isDragging ? "rotate-3 shadow-2xl ring-2 ring-primary z-50 scale-105" : ""}
                            `}
                          >
                            <div className="flex justify-between items-start mb-3 gap-3">
                              <h5 className="font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors">{task.title}</h5>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onDeleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-4">
                               <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                task.priority === 'high' ? 'bg-red-100 text-red-600' : 
                                task.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                {task.priority}
                              </div>
                              {task.assignee && (
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black" title={task.assignee.name}>
                                    {task.assignee.name.split(' ').map(n => n[0]).join('')}
                                  </div>
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
    if (!content.trim()) return;
    onCreate({ content, type });
    setContent('');
    setIsCreating(false);
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-slate-900">Project Intelligence</h3>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Create Report
        </Button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <Card className="bg-slate-50 border-slate-200">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex gap-4">
                  {(['daily', 'weekly'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                        type === t ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                    >
                      {t === 'daily' ? 'Daily Standup' : 'Weekly Summary'}
                    </button>
                  ))}
                </div>
                <textarea 
                  required
                  rows={4}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-slate-700 transition-all"
                  placeholder={type === 'daily' ? "What's the progress today?" : "Key milestones this week..."}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="submit">Publish Report</Button>
                  <Button variant="ghost" type="button" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6">
        {reports.map((report, index) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} key={report.id}>
            <Card className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                    report.type === 'daily' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {report.type}
                  </span>
                  <div className="h-4 w-px bg-slate-200" />
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(report.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </span>
                </div>
                <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
              </div>
              <p className="text-slate-700 text-lg leading-relaxed font-medium whitespace-pre-wrap">{report.content}</p>
            </Card>
          </motion.div>
        ))}
        {reports.length === 0 && (
           <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h4 className="text-slate-500 font-bold">Insights needed</h4>
            <p className="text-slate-400 text-sm">Create your first report to track project velocity.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MembersView: React.FC<{
  members: User[];
  ownerId: string;
  onAdd: (email: string) => void;
  onRemove: (userId: string) => void;
  canManage: boolean;
  isAdding: boolean;
}> = ({ members, ownerId, onAdd, onRemove, canManage, isAdding }) => {
  const [email, setEmail] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onAdd(email);
    setEmail('');
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-slate-900">Collaboration Team</h3>
        {canManage && (
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" /> Invite Member
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="bg-slate-50 border-slate-200 max-w-xl">
              <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                <Input 
                  placeholder="Collaborator's email address"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  icon={<Mail className="w-5 h-5" />}
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Button type="submit" isLoading={isAdding}>Send Invite</Button>
                  <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member, index) => (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} key={member.id}>
            <Card className="p-6 flex items-center justify-between group overflow-hidden relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg border-2 border-primary/5">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    {member.name}
                    {member.id === ownerId && (
                      <span className="text-[9px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded-full tracking-tighter">Owner</span>
                    )}
                  </h4>
                  <p className="text-slate-400 text-xs font-medium">{member.email}</p>
                </div>
              </div>
              
              {canManage && member.id !== ownerId && (
                <button 
                  onClick={() => { if(window.confirm(`Remove ${member.name}?`)) onRemove(member.id); }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProjectDetail;
