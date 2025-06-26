import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

interface ChatState {
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  activeChat: string | null;
  isLoading: boolean;
}

const initialState: ChatState = {
  chats: [],
  messages: {},
  activeChat: null,
  isLoading: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChats: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
    },
    addChat: (state, action: PayloadAction<Chat>) => {
      state.chats.unshift(action.payload);
    },
    updateChat: (state, action: PayloadAction<Chat>) => {
      const index = state.chats.findIndex(chat => chat.id === action.payload.id);
      if (index !== -1) {
        state.chats[index] = action.payload;
      }
    },
    removeChat: (state, action: PayloadAction<string>) => {
      state.chats = state.chats.filter(chat => chat.id !== action.payload);
      if (state.activeChat === action.payload) {
        state.activeChat = null;
      }
      delete state.messages[action.payload];
    },
    setMessages: (state, action: PayloadAction<{ chatId: string; messages: Message[] }>) => {
      const { chatId, messages } = action.payload;
      state.messages[chatId] = messages;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const { chatId } = message;

      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }

      state.messages[chatId].push(message);

      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = message;
        state.chats[chatIndex].lastMessageTime = message.timestamp;
        const chat = state.chats.splice(chatIndex, 1)[0];
        state.chats.unshift(chat);
      }
    },
    updateMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const { chatId } = message;

      if (state.messages[chatId]) {
        const index = state.messages[chatId].findIndex(m => m.id === message.id);
        if (index !== -1) {
          state.messages[chatId][index] = message;
        }
      }

      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1 && state.chats[chatIndex].lastMessage?.id === message.id) {
        state.chats[chatIndex].lastMessage = message;
      }
    },
    removeMessage: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      for (const chatId in state.messages) {
        state.messages[chatId] = state.messages[chatId].filter(m => m.id !== messageId);
      }
    },
    setActiveChat: (state, action: PayloadAction<string | null>) => {
      state.activeChat = action.payload;
      if (action.payload) {
        const chatIndex = state.chats.findIndex(chat => chat.id === action.payload);
        if (chatIndex !== -1) {
          state.chats[chatIndex].unreadCount = 0;
        }
      }
    },
    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1 && state.activeChat !== chatId) {
        state.chats[chatIndex].unreadCount += 1;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setChats,
  addChat,
  updateChat,
  removeChat,
  setMessages,
  addMessage,
  updateMessage,
  removeMessage,
  setActiveChat,
  incrementUnreadCount,
  setLoading,
} = chatSlice.actions;

export default chatSlice.reducer;