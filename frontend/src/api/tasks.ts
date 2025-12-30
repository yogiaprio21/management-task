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
