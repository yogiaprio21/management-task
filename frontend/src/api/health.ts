import api from './client';

export interface HealthCheckResponse {
  status: 'ok' | 'error' | 'shutting_down';
  info: Record<string, any>;
  error: Record<string, any>;
  details: Record<string, any>;
}

export const checkHealth = async () => {
  const response = await api.get<HealthCheckResponse>('/health');
  return response.data;
};
