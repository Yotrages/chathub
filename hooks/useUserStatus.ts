import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/context/socketContext';
import { api } from '@/libs/axios/config';

export const useUserStatus = (currentChat: any, user: any, isUserOnline: boolean) => {
  const [userStatuses, setUserStatuses] = useState<Map<string, { isOnline: boolean; username: string }>>(new Map());
  const { socket } = useSocket();

  const updateUserStatus = useCallback((userId: string, online: boolean, username?: string) => {
    setUserStatuses((prev) => {
      const newStatuses = new Map(prev);
      const existing = newStatuses.get(userId) || { username: username || '' };
      newStatuses.set(userId, { ...existing, isOnline: online });
      return newStatuses;
    });
  }, []);

  useEffect(() => {
    if (!socket || !currentChat || !isUserOnline || !user) return;

    const handleUserStatusChange = ({ userId, online }: { userId: string; online: boolean }) => {
      if (currentChat.participants.some((p: any) => p._id === userId)) {
        updateUserStatus(userId, online);
      }
    };

    const handleUserOnline = async ({ userId }: { userId: string }) => {
      if (currentChat.participants.some((p: any) => p._id === userId)) {
        try {
          const response = await api.get(`/auth/status/${userId}`);
          if (response.data.isOnline) {
            updateUserStatus(userId, true);
          }
        } catch (err) {
          console.error('Error fetching user status:', err);
        }
      }
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      if (currentChat.participants.some((p: any) => p._id === userId)) {
        updateUserStatus(userId, false);
      }
    };

    socket.on('user_status_change', handleUserStatusChange);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);

    // Fetch initial statuses for participants
    currentChat.participants.forEach(async (p: any) => {
      if (p._id !== user._id) {
        try {
          const response = await api.get(`/auth/status/${p._id}`);
          updateUserStatus(p._id, response.data.isOnline, p.username || 'Unknown');
        } catch (err: any) {
          if (err.response?.status === 403) {
            updateUserStatus(p._id, false, p.username || 'Unknown');
          }
        }
      }
    });

    return () => {
      socket.off('user_status_change', handleUserStatusChange);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
    };
  }, [socket, currentChat, isUserOnline, user, updateUserStatus]);

  return { userStatuses, updateUserStatus };
};
