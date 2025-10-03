'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { Notification, NotificationResponse } from '@/types/index';
import { api } from '@/libs/axios/config';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  showNotificationPopup: (notification: Notification) => void;
  popupNotification: Notification | null;
  hideNotificationPopup: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  userId: string | null;
  token: any;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  userId, 
  token 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [popupNotification, setPopupNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (!userId || !token) {
      console.log('Skipping socket connection: userId or token missing');
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
     auth: { 
        token: token,
        userId: userId 
      },
      timeout: 10000,
      reconnectionAttempts: 10,
      autoConnect: true,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('notification Connected to socket server, Socket ID:', newSocket.id);
    });

    newSocket.on('new_notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      showNotificationPopup(notification);
    });

    newSocket.on('notification_read', (notificationId: string) => {
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    newSocket.on('notification_all_read', () => {
       setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    })

    return () => {
      newSocket.disconnect();
    };
  }, [userId, token]);

  const fetchNotifications = async (pageNum: number = 1) => {
    if (!userId || !token) {
      console.log('Skipping fetchNotifications: userId or token missing');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/notifications?page=${pageNum}&limit=20`)

      if (response.status === 500) throw new Error('Failed to fetch notifications');

      const data: NotificationResponse = response.data;
      
      if (pageNum === 1) {
        setNotifications(data.data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.data.notifications]);
      }
      
      setUnreadCount(data.data.unreadCount);
      setHasMore(data.data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!userId || !token) return;

    try {
      const response = await api.put(`/notifications/${notificationId}/read`)

      if (response.status === 500) throw new Error('Failed to mark notification as read');

      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId || !token) return;

    if (socket && socket.connected) {
      socket.emit('mark_all_notification')
    } else {
      try {
      const response = await api.put('/notifications/read-all')

      if (response.data === 500) throw new Error('Failed to mark all notifications as read');

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!userId || !token) return;

    try {
      const response = await api.delete(`/notifications/${notificationId}`)

      if (response.status === 500) throw new Error('Failed to delete notification');

      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const showNotificationPopup = (notification: Notification) => {
    setPopupNotification(notification);
    setTimeout(() => setPopupNotification(null), 5000);
  };

  const hideNotificationPopup = () => {
    setPopupNotification(null);
  };

  const value = {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showNotificationPopup,
    popupNotification,
    hideNotificationPopup,
    socket,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

(() => {})