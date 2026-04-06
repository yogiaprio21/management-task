import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Trash2, Edit2, Calendar } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import { toast } from 'react-hot-toast';
import type { Task, CreateTaskDto, UpdateTaskDto } from '../types';
import { AxiosError } from 'axios';
import clsx from 'clsx';
import { Skeleton } from '../components/Skeleton';

const TaskList: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'me' | 'all'>('me');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasks(''), // Fetch all tasks
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created successfully');
      setIsModalOpen(false);
    },
    onError: () => toast.error('Failed to create task'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated successfully');
      setIsModalOpen(false);
      setEditingTask(undefined);
    },
    onError: (err: AxiosError) => {
      toast.error((err.response?.data as { message?: string })?.message || 'Failed to update task');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted successfully');
    },
    onError: () => toast.error('Failed to delete task'),
  });

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === 'all' || task.assigneeId === user?.id;
      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });
  }, [tasks, search, statusFilter, priorityFilter, assigneeFilter, user?.id]);

  const handleCreate = (data: CreateTaskDto | UpdateTaskDto) => {
    createMutation.mutate(data as CreateTaskDto);
  };

  const handleUpdate = (data: CreateTaskDto | UpdateTaskDto) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: data as UpdateTaskDto });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(id);
    }
  };

  const openCreateModal = () => {
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // RBAC for Delete Button
  const canDelete = () => {
    if (user?.role === 'admin') return true;
    // Strict reading: Only Admin can delete.
    // If we want to allow Manager to delete own tasks:
    // return user?.role === 'manager' && task.creatorId === user.id;
    return false;
  };

  // canEdit is not used, as everyone can open the modal to view

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton width={150} height={32} />
          <Skeleton width={100} height={40} />
        </div>
        <Skeleton height={400} className="rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Tasks</h1>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex items-center">
            <button 
              onClick={() => setAssigneeFilter('me')}
              className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${assigneeFilter === 'me' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              My Tasks
            </button>
            <button 
              onClick={() => setAssigneeFilter('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${assigneeFilter === 'all' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              All Tasks
            </button>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 border rounded-lg appearance-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-sm font-medium">
              <tr>
                <th className="px-6 py-4">Task</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Assignee</th>
                <th className="px-6 py-4">Deadline</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No tasks found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{task.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        'px-2.5 py-1 rounded-full text-xs font-medium capitalize',
                        {
                          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300': task.status === 'todo',
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300': task.status === 'in_progress',
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300': task.status === 'review',
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300': task.status === 'done',
                        }
                      )}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        'flex items-center gap-1.5 text-sm',
                        {
                          'text-red-600 dark:text-red-400': task.priority === 'high',
                          'text-orange-500 dark:text-orange-400': task.priority === 'medium',
                          'text-green-600 dark:text-green-400': task.priority === 'low',
                        }
                      )}>
                        {task.priority === 'high' && '🔴'}
                        {task.priority === 'medium' && '🟡'}
                        {task.priority === 'low' && '🟢'}
                        <span className="capitalize">{task.priority}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-300">
                            {task.assignee.name.charAt(0)}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{task.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {task.deadline ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Calendar className="w-4 h-4" />
                          {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(task)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {canDelete() && (
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={editingTask ? handleUpdate : handleCreate}
        task={editingTask}
        isCreating={!editingTask}
      />
    </div>
  );
};

export default TaskList;
