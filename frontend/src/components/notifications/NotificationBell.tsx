import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Inbox, Clock, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const markAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = () => setIsOpen(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [isOpen]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative rounded-md p-2 transition-all duration-200 ${
          isOpen ? 'bg-primary/10 text-primary shadow-inner' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
        }`}
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 && isOpen === false ? 'animate-[bell_2s_infinite]' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[40] md:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed inset-x-4 top-20 z-[50] flex max-h-[80vh] w-auto flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 md:inset-x-auto md:right-5 md:top-5 md:w-[420px] md:max-w-[calc(100vw-2rem)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2.5 text-primary">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-50">Notifications</h4>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {unreadCount} Unread
                    </p>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllMutation.mutate()}
                    className="flex items-center gap-1.5 rounded-md bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Mark all
                  </button>
                )}
              </div>

              {/* List Content */}
              <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
                {notifications.length === 0 ? (
                  <div className="py-20 px-8 text-center flex flex-col items-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-lg bg-slate-50 text-slate-300 dark:bg-slate-800 dark:text-slate-500">
                      <Bell className="w-10 h-10" />
                    </div>
                    <h5 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-50">No alerts yet</h5>
                    <p className="mx-auto max-w-[240px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                      We'll notify you when something important happens in your workspace.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-1 px-2">
                    {notifications.map((notification, idx) => (
                      <motion.div 
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`relative flex cursor-pointer gap-4 rounded-lg p-4 transition-all duration-200 ${
                          !notification.isRead
                            ? 'bg-primary/5 hover:bg-primary/[0.08]'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        onClick={() => {
                          if (!notification.isRead) markReadMutation.mutate(notification.id);
                        }}
                      >
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md shadow-sm ${
                          !notification.isRead ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          <User className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex justify-between items-start mb-1">
                            <p className={`text-sm leading-tight line-clamp-1 truncate ${
                              !notification.isRead ? 'font-bold text-slate-900 dark:text-slate-50' : 'font-semibold text-slate-700 dark:text-slate-300'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="mb-3 line-clamp-2 text-sm font-medium leading-snug text-slate-600 dark:text-slate-400">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* View All Footer (Optional Placeholder) */}
              {notifications.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950">
                  <button className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors">
                    End of notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes bell {
          0%, 100% { transform: rotate(0deg); }
          20%, 60% { transform: rotate(15deg); }
          40%, 80% { transform: rotate(-15deg); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default NotificationBell;
