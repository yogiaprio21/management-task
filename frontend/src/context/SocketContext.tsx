import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

interface NotificationPayload {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const socket = useMemo(() => {
    if (!isAuthenticated || !user) {
      return null;
    }

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return io(backendUrl, {
      auth: {
        token: localStorage.getItem('token'),
      },
      query: {
        userId: user.id,
      },
      autoConnect: false,
    });
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!socket) return;

    socket.connect();

    const onConnect = () => {
      console.log('Socket connected');
    };

    const onNotification = (payload: NotificationPayload) => {
      toast(payload.message || 'New notification', {
        icon: '🔔',
      });
    };

    socket.on('connect', onConnect);
    socket.on('notification', onNotification);

    return () => {
      socket.off('connect', onConnect);
      socket.off('notification', onNotification);
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
