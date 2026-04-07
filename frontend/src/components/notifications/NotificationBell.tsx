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
        className={`relative p-2.5 rounded-2xl transition-all duration-300 ${
          isOpen ? 'bg-primary/10 text-primary shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
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
              className="fixed inset-x-4 top-20 md:absolute md:inset-auto md:right-0 md:top-full md:mt-4 w-auto md:w-[420px] bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/40 z-[50] overflow-hidden flex flex-col max-h-[80vh] md:max-h-[600px]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100/50 flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg">Notifications</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {unreadCount} Unread
                    </p>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllMutation.mutate()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary/5 text-primary hover:bg-primary text-xs font-bold rounded-full transition-all group hover:text-white"
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
                    <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[2rem] flex items-center justify-center mb-6">
                      <Bell className="w-10 h-10" />
                    </div>
                    <h5 className="text-slate-900 font-black text-xl mb-2">No alerts yet</h5>
                    <p className="text-slate-400 font-medium max-w-[240px] leading-relaxed mx-auto">
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
                        className={`p-4 rounded-3xl transition-all duration-200 group cursor-pointer relative flex gap-4 ${
                          !notification.isRead 
                            ? 'bg-primary/5 hover:bg-primary/[0.08]' 
                            : 'hover:bg-slate-50'
                        }`}
                        onClick={() => {
                          if (!notification.isRead) markReadMutation.mutate(notification.id);
                        }}
                      >
                        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                          !notification.isRead ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <User className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex justify-between items-start mb-1">
                            <p className={`text-sm leading-tight line-clamp-1 truncate ${
                              !notification.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-600'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-2 leading-snug font-medium mb-3">
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
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
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
