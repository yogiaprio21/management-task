import api from './client';

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  projectId: string;
}

export const getWebhooks = async (projectId: string) => {
  const response = await api.get<Webhook[]>('/webhooks', { params: { projectId } });
  return response.data;
};

export const createWebhook = async (data: Omit<Webhook, 'id'>) => {
  const response = await api.post<Webhook>('/webhooks', data);
  return response.data;
};

export const deleteWebhook = async (id: string) => {
  const response = await api.delete(`/webhooks/${id}`);
  return response.data;
};
