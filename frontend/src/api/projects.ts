import api from './client';
import type { CreateProjectDto, Project, UpdateProjectDto } from '../types';

export const getProjects = async () => {
  const response = await api.get<Project[]>('/projects');
  return response.data;
};

export const getProject = async (id: string) => {
  const response = await api.get<Project>(`/projects/${id}`);
  return response.data;
};

export const createProject = async (data: CreateProjectDto) => {
  const response = await api.post<Project>('/projects', data);
  return response.data;
};

export const updateProject = async (id: string, data: UpdateProjectDto) => {
  const response = await api.patch<Project>(`/projects/${id}`, data);
  return response.data;
};

export const deleteProject = async (id: string) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};

export const addProjectMember = async (projectId: string, email: string) => {
  const response = await api.post<Project>(`/projects/${projectId}/members`, { email });
  return response.data;
};

export const removeProjectMember = async (projectId: string, userId: string) => {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response.data;
};
