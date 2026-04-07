import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notifications';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const markAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          >
            <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
              <h4 className="font-bold text-gray-900">Notifications</h4>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllMutation.mutate()}
                  className="text-xs font-semibold text-primary hover:text-blue-700"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No notifications yet.</div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border-b hover:bg-gray-50 transition-colors group cursor-pointer ${!notification.read ? 'bg-blue-50/30' : ''}`}
                    onClick={() => {
                       if(!notification.read) markReadMutation.mutate(notification.id);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <p className={`text-sm ${!notification.read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                        {notification.title}
                      </p>
                      {!notification.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                    <p className="text-[10px] text-gray-400 mt-2 font-semibold">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
