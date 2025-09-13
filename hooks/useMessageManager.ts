import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { useSocket } from '@/context/socketContext';
import { useChat } from '@/hooks/useChat';
import { api } from '@/libs/axios/config';
import debounce from 'lodash/debounce';

export const useMessageManagement = (currentChat: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [markedAsReadChats, setMarkedAsReadChats] = useState<Set<string>>(new Set());
  const [userStatuses, setUserStatuses] = useState<Map<string, { isOnline: boolean; username: string }>>(new Map());
  
  // Use refs to track loading and loaded state to avoid stale closures
  const loadingChatsRef = useRef<Set<string>>(new Set());
  const loadedChatsRef = useRef<Set<string>>(new Set());
  
  // Add refs to track failed loads and auth failures
  const failedChatsRef = useRef<Set<string>>(new Set());
  const lastFailureTimeRef = useRef<Map<string, number>>(new Map());
  const authFailedRef = useRef<boolean>(false); // Track if auth has failed
  const retryTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const { socket } = useSocket();
  const { activeChat, messages } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  const { loadMessages, joinChat, markMessagesAsRead } = useChat();
  
  const chatMessages = activeChat ? messages[activeChat] || [] : [];

  // Debounced mark as read function
  const debouncedMarkAsRead = useCallback(
    debounce((chatId: string) => {
      if (!markedAsReadChats.has(chatId) && !authFailedRef.current) {
        markMessagesAsRead(chatId);
      }
    }, 1000), 
    [markMessagesAsRead, markedAsReadChats]
  );

  // Check if error is authentication related
  const isAuthError = (error: any): boolean => {
    return error?.response?.status === 401 || 
           error?.response?.status === 403 ||
           error?.code === 'UNAUTHORIZED' ||
           error?.message?.toLowerCase().includes('unauthorized') ||
           error?.message?.toLowerCase().includes('session expired');
  };

  // Check if error indicates rate limiting
  const isRateLimitError = (error: any): boolean => {
    return error?.response?.status === 429;
  };

  // Clear retry timeout for a chat
  const clearRetryTimeout = (chatId: string) => {
    const timeout = retryTimeoutRef.current.get(chatId);
    if (timeout) {
      clearTimeout(timeout);
      retryTimeoutRef.current.delete(chatId);
    }
  };

  // Load chat messages with comprehensive error handling
  const loadChatMessages = useCallback(async (chatId: string, isRetry: boolean = false) => {
    // Stop all operations if auth has failed
    if (authFailedRef.current) {
      console.log('Auth failed, stopping message loading');
      return;
    }

    // Prevent duplicate loading using refs
    if (loadedChatsRef.current.has(chatId) || loadingChatsRef.current.has(chatId)) {
      console.log(`Skipping load for ${chatId} - already loaded or loading`);
      return;
    }

    // Check if we've failed too recently (prevent rapid retries)
    const lastFailure = lastFailureTimeRef.current.get(chatId);
    const now = Date.now();
    const minRetryInterval = isRetry ? 5000 : 2000; // 5s for manual retry, 2s for auto

    if (lastFailure && (now - lastFailure) < minRetryInterval) {
      console.log(`Skipping load for ${chatId} - too soon since last failure`);
      return;
    }

    console.log(`Loading messages for chat: ${chatId}${isRetry ? ' (retry)' : ''}`);
    loadingChatsRef.current.add(chatId);
    clearRetryTimeout(chatId);

    try {
      setIsLoading(true);
      await loadMessages(chatId);
      
      // Success - clear failure tracking
      loadedChatsRef.current.add(chatId);
      failedChatsRef.current.delete(chatId);
      lastFailureTimeRef.current.delete(chatId);
      
      console.log(`Successfully loaded messages for chat: ${chatId}`);
    } catch (error: any) {
      console.error(`Failed to load messages for ${chatId}:`, error);
      
      // Track failure time
      lastFailureTimeRef.current.set(chatId, now);
      failedChatsRef.current.add(chatId);

      // Handle different types of errors
      if (isAuthError(error)) {
        console.log('Authentication error detected - stopping all message loading');
        authFailedRef.current = true;
        
        // Clear all tracking to prevent further attempts
        loadingChatsRef.current.clear();
        failedChatsRef.current.clear();
        lastFailureTimeRef.current.clear();
        
        // Clear all retry timeouts
        retryTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
        retryTimeoutRef.current.clear();
        
        // Don't schedule retry for auth errors - let the auth system handle redirect
        return;
      } else if (isRateLimitError(error)) {
        console.log('Rate limit error - will retry after longer delay');
        // Schedule retry after longer delay for rate limiting
        const retryDelay = 10000; // 10 seconds
        const timeout = setTimeout(() => {
          console.log(`Retrying after rate limit for chat: ${chatId}`);
          loadChatMessages(chatId, true);
        }, retryDelay);
        retryTimeoutRef.current.set(chatId, timeout);
      } else if (navigator.onLine) {
        // Network/server error but we're online - schedule retry with exponential backoff
        const failureCount = Array.from(lastFailureTimeRef.current.entries())
          .filter(([_, time]) => now - time < 60000).length; // Count failures in last minute
        
        const retryDelay = Math.min(5000 * Math.pow(2, failureCount - 1), 30000); // Max 30s
        
        console.log(`Scheduling retry for ${chatId} in ${retryDelay}ms (attempt ${failureCount})`);
        
        const timeout = setTimeout(() => {
          console.log(`Auto-retrying load for chat: ${chatId}`);
          loadChatMessages(chatId, true);
        }, retryDelay);
        retryTimeoutRef.current.set(chatId, timeout);
      }
    } finally {
      setIsLoading(false);
      loadingChatsRef.current.delete(chatId);
    }
  }, [loadMessages]);

  // Handle active chat changes
  useEffect(() => {
    if (!activeChat || !currentChat || authFailedRef.current) {
      console.log('No active chat, current chat, or auth failed - skipping');
      return;
    }

    console.log(`Active chat changed to: ${activeChat}`);

    // Always join the chat (this should be safe even with auth issues)
    try {
      joinChat(activeChat);
    } catch (error) {
      console.error('Failed to join chat:', error);
      if (isAuthError(error)) {
        authFailedRef.current = true;
        return;
      }
    }

    // Load messages if not already loaded and online and auth is good
    if (!loadedChatsRef.current.has(activeChat) && navigator.onLine && !authFailedRef.current) {
      console.log(`Loading messages for new active chat: ${activeChat}`);
      loadChatMessages(activeChat);
    } else {
      console.log(`Messages already loaded for chat: ${activeChat} or conditions not met`);
    }
  }, [activeChat, currentChat, joinChat, loadChatMessages]);

  // Mark messages as read when new messages arrive
  useEffect(() => {
    if (!activeChat || chatMessages.length === 0 || authFailedRef.current) return;

    const hasUnreadMessages = chatMessages.some(msg => {
      const senderId = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id;
      return senderId !== user?._id && !msg.readBy?.some(rb => rb.userId?._id === user?._id);
    });

    if (hasUnreadMessages) {
      const markAsReadKey = `${activeChat}-${chatMessages.length}`;
      if (!markedAsReadChats.has(markAsReadKey)) {
        debouncedMarkAsRead(activeChat);
        setMarkedAsReadChats((prev) => new Set([...prev, markAsReadKey]));
      }
    }
  }, [chatMessages, activeChat, user?._id, markedAsReadChats, debouncedMarkAsRead]);

  // Handle typing indicators
  useEffect(() => {
    if (!socket || !activeChat || authFailedRef.current) return;

    const handleTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === activeChat && data.userId !== user?._id) {
        setTypingUsers((prev) => [...new Set([...prev, data.userId])]);
      }
    };

    const handleStopTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === activeChat) {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
      }
    };

    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, activeChat, user?._id]);

  // Handle user status changes with auth error handling
  useEffect(() => {
    if (!socket || !activeChat || !currentChat || !user || authFailedRef.current) return;

    const handleUserStatusChange = ({ userId, online }: { userId: string; online: boolean }) => {
      if (currentChat.participants.some((p: any) => p._id === userId)) {
        setUserStatuses((prev) => {
          const newStatuses = new Map(prev);
          const existing = newStatuses.get(userId) || { username: '' };
          newStatuses.set(userId, { ...existing, isOnline: online });
          return newStatuses;
        });
      }
    };

    const handleUserOnline = async ({ userId }: { userId: string }) => {
      if (authFailedRef.current) return; // Don't make API calls if auth failed
      
      if (currentChat.participants.some((p: any) => p._id === userId)) {
        try {
          const response = await api.get(`/auth/status/${userId}`);
          if (response.data.isOnline) {
            setUserStatuses((prev) => {
              const newStatuses = new Map(prev);
              const existing = newStatuses.get(userId) || { username: '' };
              newStatuses.set(userId, { ...existing, isOnline: true });
              return newStatuses;
            });
          }
        } catch (err: any) {
          if (isAuthError(err)) {
            console.log('Auth error in user status fetch - stopping further requests');
            authFailedRef.current = true;
            return;
          }
          console.error('Error fetching user status:', err);
        }
      }
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      if (currentChat.participants.some((p: any) => p._id === userId)) {
        setUserStatuses((prev) => {
          const newStatuses = new Map(prev);
          const existing = newStatuses.get(userId) || { username: '' };
          newStatuses.set(userId, { ...existing, isOnline: false });
          return newStatuses;
        });
      }
    };

    socket.on('user_status_change', handleUserStatusChange);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);

    // Fetch initial statuses with auth error handling
    const fetchInitialStatuses = async () => {
      for (const p of currentChat.participants) {
        if (p._id !== user._id && !authFailedRef.current) {
          try {
            const response = await api.get(`/auth/status/${p._id}`);
            setUserStatuses((prev) => {
              const newStatuses = new Map(prev);
              newStatuses.set(p._id, { 
                isOnline: response.data.isOnline, 
                username: p.username || 'Unknown' 
              });
              return newStatuses;
            });
          } catch (err: any) {
            if (isAuthError(err)) {
              console.log('Auth error in initial status fetch - stopping');
              authFailedRef.current = true;
              break; // Stop the loop
            } else if (err.response?.status === 403) {
              setUserStatuses((prev) => {
                const newStatuses = new Map(prev);
                newStatuses.set(p._id, { 
                  isOnline: false, 
                  username: p.username || 'Unknown' 
                });
                return newStatuses;
              });
            } else {
              console.error('Error fetching user status:', err);
            }
          }
        }
      }
    };

    fetchInitialStatuses();

    return () => {
      socket.off('user_status_change', handleUserStatusChange);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
    };
  }, [socket, activeChat, currentChat, user]);

  // Clear tracking when activeChat changes
  useEffect(() => {
    setMarkedAsReadChats(new Set());
  }, [activeChat]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      retryTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      retryTimeoutRef.current.clear();
    };
  }, []);

  // Reset auth failure state when user changes (re-login)
  useEffect(() => {
    if (user && authFailedRef.current) {
      console.log('User changed - resetting auth failure state');
      authFailedRef.current = false;
      failedChatsRef.current.clear();
      lastFailureTimeRef.current.clear();
    }
  }, [user]);

  // Retry function for failed loads
  const retryLoadChatMessages = useCallback((chatId: string) => {
    if (authFailedRef.current) {
      console.log('Cannot retry - authentication failed');
      return;
    }
    
    // Clear failure tracking for this chat and retry
    failedChatsRef.current.delete(chatId);
    lastFailureTimeRef.current.delete(chatId);
    loadedChatsRef.current.delete(chatId);
    clearRetryTimeout(chatId);
    
    loadChatMessages(chatId, true);
  }, [loadChatMessages]);

  return {
    isLoading,
    typingUsers,
    userStatuses,
    retryLoadChatMessages,
    hasFailedChats: failedChatsRef.current.size > 0 && !authFailedRef.current,
    isAuthFailed: authFailedRef.current, // Expose auth failure state
  };
};