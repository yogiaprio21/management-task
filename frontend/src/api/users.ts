import api from './client';
import type { User } from '../types';

export const getUsers = async (limit: number = 20, offset: number = 0) => {
  const response = await api.get<User[]>('/users', {
    params: { limit, offset }
  });
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get<User>('/users/profile');
  return response.data;
};

export const updateUser = async (id: string, data: Partial<User>) => {
  const response = await api.patch<User>(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};
