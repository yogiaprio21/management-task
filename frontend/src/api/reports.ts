import api from './client';
import type { CreateReportDto, Report } from '../types';

export interface ReportsAnalytics {
  summary: {
    totalTasks: number;
    completedTasks: number;
    activeSprints: number;
    overdueTasks: number;
  };
  velocity: Array<{ name: string; planned: number; completed: number }>;
  statusCounts: Array<{ status: string; count: number }>;
  workload: Array<{ name: string; total: number; done: number }>;
}

export const getReports = async (projectId: string) => {
  const response = await api.get<Report[]>('/reports', { params: { projectId } });
  return response.data;
};

export const createReport = async (data: CreateReportDto) => {
  const response = await api.post<Report>('/reports', data);
  return response.data;
};

export const getReportsAnalytics = async (projectId: string) => {
  const response = await api.get<ReportsAnalytics>('/reports/analytics', { params: { projectId } });
  return response.data;
};
