import api from './client';
import type { CreateReportDto, Report } from '../types';

export const getReports = async (projectId: string) => {
  const response = await api.get<Report[]>('/reports', { params: { projectId } });
  return response.data;
};

export const createReport = async (data: CreateReportDto) => {
  const response = await api.post<Report>('/reports', data);
  return response.data;
};
