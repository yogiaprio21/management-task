import api from './client';

export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  info: {
    uptime: string;
    memory: string;
    database: {
      status: 'up' | 'down';
      host: string;
      latency: string;
    };
  };
}

export const checkHealth = async () => {
  const response = await api.get<HealthCheckResponse>('/health');
  return response.data;
};
