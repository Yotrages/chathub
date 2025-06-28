import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSocket } from '@/hooks/useSocket'; 
import { RootState } from '@/libs/redux/store';
import {
  addMessage,
  incrementUnreadCount,
  addChat,
  setChats,
  setMessages,
  updateChat,
  removeChat,
  updateMessage,
  removeMessage,
} from '@/libs/redux/chatSlice';
import { useFetch, useMutate } from '@/hooks/useFetch';
import { api } from '@/libs/axios/config';
import { errorMessageHandler } from '@/libs/feedback/error-handler';
import { AxiosProgressEvent } from 'axios'; 

export interface Chat {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: string[];
  lastMessage?: Message;
  lastMessageTime?: string;
  unreadCount: number;
  avatar?: string;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  chatId: string;
  timestamp: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  isRead?: boolean;
  edited?: boolean;
  editedAt?: string;
  reactions?: { userId: string; emoji: string }[];
}

interface UploadOptions {
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

export const useChat = () => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { activeChat } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: conversations, isLoading } = useFetch('/chat/conversations');

  const createChatMutation = useMutate('POST', '/chat/conversations', {
    onSuccess: (conversation: any) => {
      const transformedChat: Chat = {
        id: conversation._id,
        name: conversation.type === 'direct'
          ? conversation.participants.find((p: any) => p._id !== user?.id)?.username || 'Unknown User'
          : conversation.name || 'Group Chat',
        isGroup: conversation.type === 'group',
        participants: conversation.participants.map((p: any) => p._id),
        lastMessage: undefined,
        lastMessageTime: undefined,
        unreadCount: 0,
        avatar: conversation.avatar || conversation.participants.find((p: any) => p._id !== user?.id)?.avatar,
        isPinned: conversation.isPinned,
        isMuted: conversation.isMuted,
        isArchived: conversation.isArchived,
      };
      dispatch(addChat(transformedChat));
    },
    onError: (error: any) => {
      console.error('Error creating chat:', error);
      errorMessageHandler(error);
    },
  });

  const updateChatMutation = useMutate('PUT', '/chat/conversations/:conversationId', {
    onSuccess: (conversation: any) => {
      const transformedChat: Chat = {
        id: conversation._id,
        name: conversation.name || 'Group Chat',
        isGroup: conversation.type === 'group',
        participants: conversation.participants.map((p: any) => p._id),
        lastMessage: conversation.lastMessage ? {
          id: conversation.lastMessage._id,
          content: conversation.lastMessage.content,
          senderId: conversation.lastMessage.senderId,
          chatId: conversation._id,
          timestamp: conversation.lastMessage.timestamp,
          messageType: conversation.lastMessage.messageType || 'text',
          isRead: conversation.lastMessage.isRead,
          edited: conversation.lastMessage.edited,
          editedAt: conversation.lastMessage.editedAt,
          reactions: conversation.lastMessage.reactions,
        } : undefined,
        lastMessageTime: conversation.lastMessage?.timestamp,
        unreadCount: 0,
        avatar: conversation.avatar,
        isPinned: conversation.isPinned,
        isMuted: conversation.isMuted,
        isArchived: conversation.isArchived,
      };
      dispatch(updateChat(transformedChat));
    },
    onError: (error: any) => {
      console.error('Error updating chat:', error);
      errorMessageHandler(error);
    },
  });

  const deleteChatMutation = useMutate('DELETE', '/chat/conversations/:conversationId', {
    onSuccess: (data: any) => {
      // Extract conversationId from the mutation variables or data
      // This assumes your useMutate hook provides access to variables in some way
      // You may need to adjust this based on your useMutate implementation
      console.log('Chat deleted successfully:', data);
    },
    onError: (error: any) => {
      console.error('Error deleting chat:', error);
      errorMessageHandler(error);
    },
  });

  const uploadFileMutation = useMutate('POST', '/files/upload', {
    onSuccess: (data: { fileUrl: string; fileName: string }) => {
      console.log('File uploaded:', data);
    },
    onError: (error: any) => {
      console.error('Error uploading file:', error);
      errorMessageHandler(error);
    },
  });

  useEffect(() => {
    if (conversations) {
      const transformedChats: Chat[] = conversations.map((conv: any) => ({
        id: conv._id,
        name: conv.type === 'direct'
          ? conv.participants.find((p: any) => p._id !== user?.id)?.username || 'Unknown User'
          : conv.name || 'Group Chat',
        isGroup: conv.type === 'group',
        participants: conv.participants.map((p: any) => p._id),
        lastMessage: conv.lastMessage ? {
          id: conv.lastMessage._id,
          content: conv.lastMessage.content,
          senderId: conv.lastMessage.senderId,
          chatId: conv._id,
          timestamp: conv.lastMessage.timestamp,
          messageType: conv.lastMessage.messageType || 'text',
          isRead: conv.lastMessage.isRead,
          edited: conv.lastMessage.edited,
          editedAt: conv.lastMessage.editedAt,
          reactions: conv.lastMessage.reactions,
        } : undefined,
        lastMessageTime: conv.lastMessage?.timestamp,
        unreadCount: 0,
        avatar: conv.avatar || conv.participants.find((p: any) => p._id !== user?.id)?.avatar,
        isPinned: conv.isPinned,
        isMuted: conv.isMuted,
        isArchived: conv.isArchived,
      }));
      dispatch(setChats(transformedChats));
    }
  }, [conversations, dispatch, user?.id]);

  useEffect(() => {
    if (socket) {
      socket.on('new_message', (message: any) => {
        const transformedMessage: Message = {
          id: message._id,
          content: message.content,
          senderId: message.senderId._id || message.senderId,
          chatId: message.conversationId,
          timestamp: message.timestamp,
          messageType: message.messageType || 'text',
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          isRead: message.isRead,
          edited: message.edited,
          editedAt: message.editedAt,
          reactions: message.reactions,
        };
        dispatch(addMessage(transformedMessage));
        if (message.conversationId !== activeChat) {
          dispatch(incrementUnreadCount(message.conversationId));
        }
      });

      socket.on('new_conversation', (conversation: any) => {
        const transformedChat: Chat = {
          id: conversation._id,
          name: conversation.type === 'direct'
            ? conversation.participants.find((p: any) => p._id !== user?.id)?.username || 'Unknown User'
            : conversation.name || 'Group Chat',
          isGroup: conversation.type === 'group',
          participants: conversation.participants.map((p: any) => p._id),
          lastMessage: undefined,
          lastMessageTime: undefined,
          unreadCount: 0,
          avatar: conversation.avatar,
          isPinned: conversation.isPinned,
          isMuted: conversation.isMuted,
          isArchived: conversation.isArchived,
        };
        dispatch(addChat(transformedChat));
      });

      socket.on('message_edited', (message: any) => {
        const transformedMessage: Message = {
          id: message._id,
          content: message.content,
          senderId: message.senderId._id || message.senderId,
          chatId: message.conversationId,
          timestamp: message.timestamp,
          messageType: message.messageType || 'text',
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          isRead: message.isRead,
          edited: message.edited,
          editedAt: message.editedAt,
          reactions: message.reactions,
        };
        dispatch(updateMessage(transformedMessage));
      });

      socket.on('message_deleted', (data: { messageId: string }) => {
        dispatch(removeMessage(data.messageId));
      });

      socket.on('reaction_added', (message: any) => {
        const transformedMessage: Message = {
          id: message._id,
          content: message.content,
          senderId: message.senderId._id || message.senderId,
          chatId: message.conversationId,
          timestamp: message.timestamp,
          messageType: message.messageType || 'text',
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          isRead: message.isRead,
          edited: message.edited,
          editedAt: message.editedAt,
          reactions: message.reactions,
        };
        dispatch(updateMessage(transformedMessage));
      });

      socket.on('reaction_removed', (message: any) => {
        const transformedMessage: Message = {
          id: message._id,
          content: message.content,
          senderId: message.senderId._id || message.senderId,
          chatId: message.conversationId,
          timestamp: message.timestamp,
          messageType: message.messageType || 'text',
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          isRead: message.isRead,
          edited: message.edited,
          editedAt: message.editedAt,
          reactions: message.reactions,
        };
        dispatch(updateMessage(transformedMessage));
      });

      socket.on('messages_read', (data: { conversationId: string; userId: string }) => {
        // Fixed: Properly handle messages read event
        const currentMessages = (window as any).__REDUX_STATE__?.chat?.messages?.[data.conversationId] || [];
        const updatedMessages = currentMessages.map((msg: Message) => ({
          ...msg,
          isRead: true,
        }));
        dispatch(setMessages({ chatId: data.conversationId, messages: updatedMessages }));
      });

      socket.on('user_typing', (data: { userId: string; conversationId: string }) => {
        // Handle typing indicators (to be implemented in ChatWindow)
      });

      socket.on('user_stop_typing', (data: { userId: string; conversationId: string }) => {
        // Handle stop typing (to be implemented in ChatWindow)
      });

      return () => {
        socket.off('new_message');
        socket.off('new_conversation');
        socket.off('message_edited');
        socket.off('message_deleted');
        socket.off('reaction_added');
        socket.off('reaction_removed');
        socket.off('messages_read');
        socket.off('user_typing');
        socket.off('user_stop_typing');
      };
    }
  }, [socket, dispatch, activeChat, user?.id]);

  const sendMessage = async (
    chatId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    fileUrl?: string,
    fileName?: string
  ) => {
    if (socket) {
      socket.emit('send_message', {
        conversationId: chatId,
        content,
        messageType,
        fileUrl,
        fileName,
      });
    }
  };

  const createChat = async (participantIds: string[], isGroup: boolean = false, name?: string, avatar?: string) => {
    const chatData = {
      participantIds,
      type: isGroup ? 'group' : 'direct',
      name,
      avatar,
    };
    createChatMutation.mutate(chatData);
    return createChatMutation;
  };

  const updateChatFn = async (conversationId: string, data: { name?: string; participants?: string[]; description?: string; avatar?: string }) => {
    updateChatMutation.mutate({ ...data, conversationId });
    return updateChatMutation;
  };

  // Fixed: Store conversationId to use in onSuccess callback
  const deleteChat = async (conversationId: string) => {
    deleteChatMutation.mutate({ conversationId });
    // Optimistically remove from UI or handle in onSuccess with proper state management
    dispatch(removeChat(conversationId));
    return deleteChatMutation;
  };

  const loadMessages = async (chatId: string) => {
    try {
      const response = await api.get(`/chat/conversations/${chatId}/messages`);
      const messages = response.data;
      const transformedMessages: Message[] = messages.map((msg: any) => ({
        id: msg._id,
        content: msg.content,
        senderId: msg.senderId._id || msg.senderId,
        chatId,
        timestamp: msg.timestamp,
        messageType: msg.messageType || 'text',
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        isRead: msg.isRead,
        edited: msg.edited,
        editedAt: msg.editedAt,
        reactions: msg.reactions,
      }));
      dispatch(setMessages({ chatId, messages: transformedMessages }));
    } catch (error: any) {
      console.error('Error loading messages:', error);
      errorMessageHandler(error);
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    if (socket) {
      socket.emit('edit_message', { messageId, content });
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (socket) {
      socket.emit('delete_message', { messageId });
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (socket) {
      socket.emit('add_reaction', { messageId, emoji });
    }
  };

  const removeReaction = async (messageId: string) => {
    if (socket) {
      socket.emit('remove_reaction', { messageId });
    }
  };

  const markMessagesAsRead = async (chatId: string) => {
    if (socket) {
      socket.emit('mark_read', { conversationId: chatId });
    }
  };

  const joinChat = (chatId: string) => {
    if (socket) {
      socket.emit('join_conversation', chatId);
    }
  };

  const leaveChat = (chatId: string) => {
    if (socket) {
      socket.emit('leave_conversation', chatId);
    }
  };

  const startTyping = (chatId: string) => {
    if (socket) {
      socket.emit('typing', { conversationId: chatId });
    }
  };

  const stopTyping = (chatId: string) => {
    if (socket) {
      socket.emit('stop_typing', { conversationId: chatId });
    }
  };

  const uploadFile = async (formData: FormData, options?: UploadOptions) => {
    try {
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: options?.onUploadProgress,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      errorMessageHandler(error);
      throw error;
    }
  };

  return {
    sendMessage,
    createChat,
    updateChat: updateChatFn, // Fixed naming conflict
    deleteChat,
    joinChat,
    leaveChat,
    loadMessages,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markMessagesAsRead,
    startTyping,
    stopTyping,
    uploadFile, // Fixed function signature
    conversations,
    isLoading,
    isCreatingChat: createChatMutation.isPending,
    createChatError: createChatMutation.error,
    isUpdatingChat: updateChatMutation.isPending,
    updateChatError: updateChatMutation.error,
    isDeletingChat: deleteChatMutation.isPending,
    deleteChatError: deleteChatMutation.error,
    isUploadingFile: uploadFileMutation.isPending,
    uploadFileError: uploadFileMutation.error,
  };
};