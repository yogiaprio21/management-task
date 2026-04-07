import api from './client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
}

export const getNotifications = async () => {
  const response = await api.get<Notification[]>('/notifications');
  return response.data;
};

export const markAsRead = async (id: string) => {
  const response = await api.patch<Notification>(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};
