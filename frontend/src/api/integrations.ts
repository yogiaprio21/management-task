import api from './client';

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  projectId: string;
  lastStatus?: string;
  lastTriggeredAt?: string;
}

export const getWebhooks = async (projectId: string) => {
  const response = await api.get<Webhook[]>('/webhooks', { params: { projectId } });
  return response.data;
};

export const createWebhook = async (data: Omit<Webhook, 'id'>) => {
  const response = await api.post<Webhook>('/webhooks', data);
  return response.data;
};

export const updateWebhook = async (id: string, data: Partial<Webhook>) => {
  const response = await api.patch<Webhook>(`/webhooks/${id}`, data);
  return response.data;
};

export const testWebhook = async (id: string) => {
  const response = await api.post<{ ok: boolean; status: number | string }>(`/webhooks/${id}/test`);
  return response.data;
};

export const deleteWebhook = async (id: string) => {
  const response = await api.delete(`/webhooks/${id}`);
  return response.data;
};
