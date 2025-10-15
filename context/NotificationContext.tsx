'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification, NotificationResponse } from '@/types/index';
import { api } from '@/libs/axios/config';
import { useSocket } from '@/context/socketContext';

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
  const [popupNotification, setPopupNotification] = useState<Notification | null>(null);

  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected || !userId || !token) {
      console.log('Skipping notification socket listeners: missing requirements');
      return;
    }

    console.log('Setting up notification socket listeners');

    const handleNewNotification = (notification: Notification) => {
      console.log('Received new notification:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      showNotificationPopup(notification);
    };

    const handleNotificationRead = (notificationId: string) => {
      console.log('Notification marked as read:', notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleAllNotificationsRead = () => {
      console.log('All notifications marked as read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    };

    // Register event listeners
    socket.on('new_notification', handleNewNotification);
    socket.on('notification_read', handleNotificationRead);
    socket.on('notification_all_read', handleAllNotificationsRead);

    // Cleanup listeners on unmount or when dependencies change
    return () => {
      console.log('Cleaning up notification socket listeners');
      socket.off('new_notification', handleNewNotification);
      socket.off('notification_read', handleNotificationRead);
      socket.off('notification_all_read', handleAllNotificationsRead);
    };
  }, [socket, isConnected, userId, token]);

  const fetchNotifications = async (pageNum: number = 1) => {
    if (!userId || !token) {
      console.log('Skipping fetchNotifications: userId or token missing');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/notifications?page=${pageNum}&limit=20`);

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
      const response = await api.put(`/notifications/${notificationId}/read`);

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

    if (socket && isConnected) {
      // Use socket if available
      socket.emit('mark_all_notification');
    } else {
      // Fallback to HTTP request
      try {
        const response = await api.put('/notifications/read-all');

        if (response.status === 500) throw new Error('Failed to mark all notifications as read');

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
      const response = await api.delete(`/notifications/${notificationId}`);

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
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};