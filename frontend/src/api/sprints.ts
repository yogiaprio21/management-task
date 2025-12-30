import api from './client';
import type { CreateSprintDto, Sprint, UpdateSprintDto } from '../types';

export const getSprints = async (projectId: string) => {
  const response = await api.get<Sprint[]>('/sprints', { params: { projectId } });
  return response.data;
};

export const getSprint = async (id: string) => {
  const response = await api.get<Sprint>(`/sprints/${id}`);
  return response.data;
};

export const createSprint = async (data: CreateSprintDto) => {
  const response = await api.post<Sprint>('/sprints', data);
  return response.data;
};

export const updateSprint = async (id: string, data: UpdateSprintDto) => {
  const response = await api.patch<Sprint>(`/sprints/${id}`, data);
  return response.data;
};

export const deleteSprint = async (id: string) => {
  const response = await api.delete(`/sprints/${id}`);
  return response.data;
};
