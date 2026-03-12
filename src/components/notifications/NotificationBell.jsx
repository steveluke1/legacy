import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { authClient } from '@/components/auth/authClient';
import { toast } from 'sonner';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get token from custom auth client
      const token = authClient.getToken();
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const response = await base44.functions.invoke('notificationGetMyNotifications', {
        token,
        limit: 20
      });

      if (response.data?.success) {
        setNotifications(response.data.data?.notifications || []);
        setUnreadCount(response.data.data?.unread_count || 0);
      } else {
        // Try fallback to old function name for backward compatibility
        try {
          const fallbackResponse = await base44.functions.invoke('notification_getMyNotifications', {
            token,
            limit: 20
          });
          
          if (fallbackResponse.data?.success) {
            setNotifications(fallbackResponse.data.notifications || []);
            const unread = (fallbackResponse.data.notifications || []).filter(n => !n.viewed_at).length;
            setUnreadCount(unread);
          }
        } catch (fallbackError) {
          setError('Não foi possível carregar as notificações.');
        }
      }
    } catch (error) {
      // Silent fail for 401 (not authenticated)
      if (error.response?.status === 401) {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        setError('Não foi possível carregar as notificações.');
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      const token = authClient.getToken();
      if (!token) return;

      const response = await base44.functions.invoke('notificationMarkRead', {
        token,
        notification_id: notifId
      });

      if (response.data?.success) {
        await loadNotifications();
      }
    } catch (error) {
      // Silent fail
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      const token = authClient.getToken();
      if (!token) return;

      const response = await base44.functions.invoke('notificationMarkAllRead', {
        token
      });

      if (response.data?.success) {
        toast.success('Todas as notificações foram marcadas como lidas.');
        await loadNotifications();
      }
    } catch (error) {
      toast.error('Erro ao marcar notificações.');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.viewed_at) {
      await markAsRead(notif.id);
    }
    setShowDropdown(false);
    if (notif.action_url) {
      navigate(notif.action_url);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-[#A9B2C7] hover:text-white transition-colors"
        title="Notificações"
        aria-label="Notificações"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-[#FF4B6A] text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg shadow-xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-[#19E0FF]/10 flex items-center justify-between">
              <h3 className="text-white font-bold">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllAsRead();
                  }}
                  disabled={markingAll}
                  className="text-[#19E0FF] hover:text-white text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  {markingAll ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3 h-3" />
                  )}
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 text-[#19E0FF] animate-spin mx-auto mb-2" />
                  <p className="text-[#A9B2C7] text-sm">Carregando...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-8 h-8 text-[#FF4B6A] mx-auto mb-2" />
                  <p className="text-[#A9B2C7] text-sm mb-3">{error}</p>
                  <button
                    onClick={loadNotifications}
                    className="text-[#19E0FF] hover:text-white text-sm transition-colors"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-[#A9B2C7]">
                  Nenhuma notificação ainda.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`
                      p-4 border-b border-[#19E0FF]/5 cursor-pointer transition-colors
                      ${notif.viewed_at ? 'bg-transparent opacity-60' : 'bg-[#19E0FF]/5 hover:bg-[#19E0FF]/10'}
                    `}
                  >
                    <p className="text-white text-sm mb-1">{notif.message}</p>
                    <p className="text-[#A9B2C7] text-xs">
                      {new Date(notif.created_date).toLocaleString('pt-BR')}
                    </p>
                    {notif.viewed_at && (
                      <Check className="w-4 h-4 text-[#19E0FF] mt-1" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}