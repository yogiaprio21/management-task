import api from './client';
import type { AuditLog } from '../types';

export const getAuditLogs = async (projectId?: string) => {
  const response = await api.get<AuditLog[]>('/audit', { params: { projectId } });
  return response.data;
};
