import api from './client';
import type { BacklogItem, CreateBacklogDto, UpdateBacklogDto } from '../types';

export const getBacklogItems = async (projectId: string) => {
  const response = await api.get<BacklogItem[]>('/backlog', { params: { projectId } });
  return response.data;
};

export const getBacklogItem = async (id: string) => {
  const response = await api.get<BacklogItem>(`/backlog/${id}`);
  return response.data;
};

export const createBacklogItem = async (data: CreateBacklogDto) => {
  const response = await api.post<BacklogItem>('/backlog', data);
  return response.data;
};

export const updateBacklogItem = async (id: string, data: UpdateBacklogDto) => {
  const response = await api.patch<BacklogItem>(`/backlog/${id}`, data);
  return response.data;
};

export const deleteBacklogItem = async (id: string) => {
  const response = await api.delete(`/backlog/${id}`);
  return response.data;
};
