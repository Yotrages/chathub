import { useState, useCallback, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import debounce from 'lodash/debounce';

export const useMessageManager = (user: any, isUserOnline: boolean) => {
  const [loadedChats, setLoadedChats] = useState<Set<string>>(new Set());
  const [markedAsReadChats, setMarkedAsReadChats] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  
  const { loadMessages, markMessagesAsRead } = useChat();

  // Create a stable debounced function
  const debouncedMarkAsRead = useCallback(
    debounce((chatId: string) => {
      markMessagesAsRead(chatId);
    }, 1000),
    [markMessagesAsRead]
  );

  const loadChatMessages = useCallback(async (chatId: string) => {
    if (!isUserOnline || !chatId) {
      return;
    }

    // Prevent loading the same chat multiple times
    if (loadedChats.has(chatId)) {
      return;
    }

    try {
      setIsLoading(true);
      await loadMessages(chatId);
      
      // Mark as loaded
      setLoadedChats((prev) => new Set([...prev, chatId]));
      
      // Mark as read if we haven't already done so
      if (!markedAsReadChats.has(chatId)) {
        debouncedMarkAsRead(chatId);
        setMarkedAsReadChats((prev) => new Set([...prev, chatId]));
      }
      
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Remove from loaded chats on error so it can be retried
      setLoadedChats((prev) => {
        const newSet = new Set(prev);
        newSet.delete(chatId);
        return newSet;
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadMessages, isUserOnline, loadedChats, markedAsReadChats, debouncedMarkAsRead]);

  const markNewMessagesAsRead = useCallback((chatId: string, messages: any[]) => {
    if (!chatId || !isUserOnline || messages.length === 0) return;

    const hasUnreadMessages = messages.some(msg => {
      const senderId = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id;
      return senderId !== user?._id && !msg.readBy?.some((rb: any) => rb.userId?._id === user?._id);
    });

    if (hasUnreadMessages) {
      const markAsReadKey = `${chatId}-${messages.length}`;
      
      if (!markedAsReadChats.has(markAsReadKey)) {
        debouncedMarkAsRead(chatId);
        setMarkedAsReadChats((prev) => new Set([...prev, markAsReadKey]));
      }
    }
  }, [user?._id, isUserOnline, markedAsReadChats, debouncedMarkAsRead]);

  const clearChatTracking = useCallback(() => {
    setMarkedAsReadChats(new Set());
  }, []);

  return {
    loadedChats,
    isLoading,
    loadChatMessages,
    markNewMessagesAsRead,
    clearChatTracking
  };
};
