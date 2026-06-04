import api from './client';
import type { Workspace, WorkspaceRole } from '../types';

export const getWorkspaces = async () => {
  const response = await api.get<Workspace[]>('/workspaces');
  return response.data;
};

export const getWorkspace = async (id: string) => {
  const response = await api.get<Workspace>(`/workspaces/${id}`);
  return response.data;
};

export const createWorkspace = async (data: { name: string; description?: string; type?: 'personal' | 'team' }) => {
  const response = await api.post<Workspace>('/workspaces', data);
  return response.data;
};

export const addWorkspaceMember = async (workspaceId: string, data: { email?: string; userId?: string; role?: WorkspaceRole }) => {
  const response = await api.post<Workspace>(`/workspaces/${workspaceId}/members`, data);
  return response.data;
};

export const removeWorkspaceMember = async (workspaceId: string, userId: string) => {
  const response = await api.delete<Workspace>(`/workspaces/${workspaceId}/members/${userId}`);
  return response.data;
};
