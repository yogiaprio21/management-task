import api from './client';
import type { AuthResponse, LoginDto, RegisterDto, User } from '../types';

export const login = async (data: LoginDto) => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};

export const register = async (data: RegisterDto) => {
  const response = await api.post<User>('/auth/register', data);
  return response.data;
};
