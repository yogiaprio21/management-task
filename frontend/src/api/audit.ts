import api from './client';
import type { AuditLog } from '../types';

export const getAuditLogs = async (limit: number = 20, offset: number = 0, projectId?: string) => {
  const response = await api.get<AuditLog[]>('/audit', { 
    params: { limit, offset, projectId } 
  });
  return response.data;
};
