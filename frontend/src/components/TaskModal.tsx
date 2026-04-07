import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getUsers } from '../api/users';
import { addComment, getTaskHistory, getTask } from '../api/tasks';
import { X, MessageSquare, Paperclip, History, Info, Send, Plus, File, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import type { Task, CreateTaskDto, UpdateTaskDto, Comment, Attachment, AuditLog } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskDto | UpdateTaskDto) => void;
  task?: Task;
  isCreating: boolean;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSubmit, task: initialTask, isCreating }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'attachments' | 'history'>('details');
  const [commentText, setCommentText] = useState('');

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => getUsers() });
  
  const { data: task } = useQuery({
    queryKey: ['task', initialTask?.id],
    queryFn: () => getTask(initialTask!.id),
    enabled: !!initialTask?.id && isOpen,
    initialData: initialTask,
  });

  const { data: history } = useQuery<AuditLog[]>({
    queryKey: ['task-history', initialTask?.id],
    queryFn: () => getTaskHistory(initialTask!.id),
    enabled: !!initialTask?.id && isOpen && activeTab === 'history',
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => addComment(task!.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', task?.id] });
      setCommentText('');
      toast.success('Comment added');
    },
    onError: () => toast.error('Failed to add comment'),
  });

  const initialFormData = useMemo(() => ({
    title: initialTask?.title || '',
    description: initialTask?.description || '',
    status: initialTask?.status || 'todo',
    priority: initialTask?.priority || 'medium',
    assigneeId: initialTask?.assigneeId || '',
    deadline: initialTask?.deadline ? new Date(initialTask.deadline).toISOString().split('T')[0] : '',
  }), [initialTask]);

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    // When the modal opens or the underlying task prop changes, reset the form data.
    // This ensures the form is clean on open and reflects updates if the task is changed externally.
    if (isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen, initialFormData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as CreateTaskDto | UpdateTaskDto);
  };

  const canEditDetails = user?.role === 'admin' || isCreating || (user?.role === 'manager' && task?.creatorId === user?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              {isCreating ? 'Create New Task' : task?.title}
            </h2>
            {!isCreating && (
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                Task ID: {task?.id.split('-')[0]}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        {!isCreating && (
          <div className="flex border-b dark:border-gray-700 px-6 gap-6">
            {[
              { id: 'details', icon: Info, label: 'Details' },
              { id: 'comments', icon: MessageSquare, label: 'Comments' },
              { id: 'attachments', icon: Paperclip, label: 'Files' },
              { id: 'history', icon: History, label: 'History' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'details' | 'comments' | 'attachments' | 'history')}
                className={`flex items-center gap-2 py-4 border-b-2 transition-all font-bold text-sm ${
                  activeTab === tab.id 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <form id="task-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Title</label>
                  <input
                    type="text"
                    required
                    disabled={!canEditDetails}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                    placeholder="Task title"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea
                    rows={4}
                    disabled={!canEditDetails}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                    placeholder="What's this task about?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Priority</label>
                  <select
                    disabled={!canEditDetails}
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Assignee</label>
                  <select
                    disabled={!canEditDetails}
                    value={formData.assigneeId}
                    onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                  >
                    <option value="">Unassigned</option>
                    {users?.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Deadline</label>
                  <input
                    type="date"
                    disabled={!canEditDetails}
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  />
                </div>
              </div>
            </form>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6 flex flex-col h-full">
              <div className="flex-1 space-y-4">
                {task?.comments?.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 font-medium italic">No comments yet</div>
                ) : (
                  task?.comments?.map((c: Comment) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">
                        {c.user?.name.charAt(0)}
                      </div>
                      <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl rounded-tl-none">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-black text-gray-700 dark:text-gray-200">{c.user?.name}</span>
                          <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <div className="relative">
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm"
                  />
                  <button 
                    onClick={() => commentText.trim() && commentMutation.mutate(commentText)}
                    disabled={commentMutation.isPending || !commentText.trim()}
                    className="absolute right-3 bottom-3 p-2 bg-primary text-white rounded-lg shadow-lg shadow-primary/20 disabled:opacity-50 hover:scale-105 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {task?.attachments?.map((a: Attachment) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 border dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                    <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                      <File className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-gray-700 dark:text-gray-200">{a.filename}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-black">{a.mimetype.split('/')[1]}</p>
                    </div>
                    <a href={a.url} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
              <button className="w-full py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-all group">
                <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-black uppercase tracking-widest">Upload File</span>
              </button>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="relative space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-700">
              {history?.map((h: AuditLog) => (
                <div key={h.id} className="relative pl-10">
                  <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-primary flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter">
                        {h.user?.name}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded uppercase">
                        {h.action}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      {new Date(h.createdAt).toLocaleString()}
                    </p>
                    {h.details && (
                      <div className="mt-2 text-[11px] bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg text-gray-400 font-mono overflow-x-auto">
                        {h.details}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {history?.length === 0 && (
                <div className="text-center py-10 text-gray-400 font-medium italic">No activity history yet</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex gap-3">
          <Button 
            type="submit" 
            form="task-form"
            className="flex-1"
            disabled={activeTab !== 'details'}
          >
            {isCreating ? 'Create Task' : 'Save Changes'}
          </Button>
          <Button variant="secondary" onClick={onClose} className="px-8">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
