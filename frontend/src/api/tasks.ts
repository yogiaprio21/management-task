import api from './client';
import type { CreateTaskDto, Task, UpdateTaskDto } from '../types';

export const getTasks = async (sprintId: string) => {
  const response = await api.get<Task[]>('/tasks', { params: { sprintId } });
  return response.data;
};

export const getTask = async (id: string) => {
  const response = await api.get<Task>(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (data: CreateTaskDto) => {
  const response = await api.post<Task>('/tasks', data);
  return response.data;
};

export const updateTask = async (id: string, data: UpdateTaskDto) => {
  const response = await api.patch<Task>(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: string) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export const addComment = async (taskId: string, content: string) => {
  const response = await api.post(`/tasks/${taskId}/comments`, { content });
  return response.data;
};

export const addAttachment = async (taskId: string, data: any) => {
  const response = await api.post(`/tasks/${taskId}/attachments`, data);
  return response.data;
};

export const getTaskHistory = async (taskId: string) => {
  const response = await api.get(`/tasks/${taskId}/history`);
  return response.data;
};
