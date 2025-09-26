import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, Chat } from '@/types';
interface ChatState {
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  activeChat: string | null;
  isLoading: boolean;
  replyingTo: { messageId: string; content: string; sender: string | { _id: string; username: string; avatar?: string } } | null;
  pinnedMessages: { [chatId: string]: Message[] };
  starredMessages: Message[];
}
const initialState: ChatState = {
  chats: [],
  messages: {},
  activeChat: null,
  isLoading: false,
  replyingTo: null,
  pinnedMessages: {},
  starredMessages: [],
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
      const index = state.chats.findIndex(chat => chat._id === action.payload._id);
      if (index !== -1) {
        state.chats[index] = action.payload;
      }
    },
    removeChat: (state, action: PayloadAction<string>) => {
      state.chats = state.chats.filter(chat => chat._id !== action.payload);
      if (state.activeChat === action.payload) {
        state.activeChat = null;
      }
      delete state.messages[action.payload];
      delete state.pinnedMessages[action.payload];
    },
    setMessages: (state, action: PayloadAction<{ chatId: string; messages: Message[] }>) => {
      state.messages[action.payload.chatId] = action.payload.messages;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const { conversationId } = message;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      const existingIndex = state.messages[conversationId].findIndex(m => m._id === message._id);
      if (existingIndex === -1) {
        state.messages[conversationId].push(message);
      } else {
        state.messages[conversationId][existingIndex] = message;
      }
      const chatIndex = state.chats.findIndex(chat => chat._id === conversationId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = message;
        state.chats[chatIndex].lastMessageTime = message.createdAt;
        const chat = state.chats.splice(chatIndex, 1)[0];
        state.chats.unshift(chat);
      }
    },
    updateMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const { conversationId } = message;
      if (state.messages[conversationId]) {
        const index = state.messages[conversationId].findIndex(m => m._id === message._id);
        if (index !== -1) {
          state.messages[conversationId][index] = message;
        }
      }
      if (state.pinnedMessages[conversationId]) {
        const pinnedIndex = state.pinnedMessages[conversationId].findIndex(m => m._id === message._id);
        if (pinnedIndex !== -1) {
          state.pinnedMessages[conversationId][pinnedIndex] = message;
        }
      }
      const starredIndex = state.starredMessages.findIndex(m => m._id === message._id);
      if (starredIndex !== -1) {
        state.starredMessages[starredIndex] = message;
      }
      const chatIndex = state.chats.findIndex(chat => chat._id === conversationId);
      if (chatIndex !== -1 && state.chats[chatIndex].lastMessage?._id === message._id) {
        state.chats[chatIndex].lastMessage = message;
      }
    },
    removeMessage: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      for (const chatId in state.messages) {
        state.messages[chatId] = state.messages[chatId].filter(m => m._id !== messageId);
      }
      for (const chatId in state.pinnedMessages) {
        state.pinnedMessages[chatId] = state.pinnedMessages[chatId].filter(m => m._id !== messageId);
      }
      state.starredMessages = state.starredMessages.filter(m => m._id !== messageId);
    },
    setActiveChat: (state, action: PayloadAction<string | null>) => {
      state.activeChat = action.payload;
      if (action.payload) {
        const chatIndex = state.chats.findIndex(chat => chat._id === action.payload);
        if (chatIndex !== -1) {
          state.chats[chatIndex].unreadCount = 0;
        }
      }
    },
    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      const chatIndex = state.chats.findIndex(chat => chat._id === action.payload);
      if (chatIndex !== -1 && state.activeChat !== action.payload) {
        state.chats[chatIndex].unreadCount += 1;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    markMessageAsRead: (state, action: PayloadAction<{conversationId: string; userId: { username: string, _id: string, avatar?: string}}>) => {
      const {conversationId, userId} = action.payload;
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].map(message => {
          const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId._id;
          if (senderId !== userId._id && !message.readBy.some(rb => rb.userId._id === userId._id)) {
            return {
              ...message,
              readBy: [...message.readBy, {userId: {_id: userId._id, avatar: userId.avatar, username: userId.username}, readAt: new Date().toISOString()}]
            };
          }
          return message;
        });
      }
    },
    setReplyingTo: (state, action: PayloadAction<ChatState['replyingTo']>) => {
      state.replyingTo = action.payload;
    },
    clearReplyingTo: (state) => {
      state.replyingTo = null;
    },
    setPinnedMessages: (state, action: PayloadAction<{ chatId: string; messages: Message[] }>) => {
      state.pinnedMessages[action.payload.chatId] = action.payload.messages;
    },
    addPinnedMessage: (state, action: PayloadAction<{ chatId: string; message: Message }>) => {
      if (!state.pinnedMessages[action.payload.chatId]) {
        state.pinnedMessages[action.payload.chatId] = [];
      }
      if (!state.pinnedMessages[action.payload.chatId].find(m => m._id === action.payload.message._id)) {
        state.pinnedMessages[action.payload.chatId].push(action.payload.message);
      }
    },
    removePinnedMessage: (state, action: PayloadAction<{ chatId: string; messageId: string }>) => {
      if (state.pinnedMessages[action.payload.chatId]) {
        state.pinnedMessages[action.payload.chatId] = state.pinnedMessages[action.payload.chatId].filter(
          m => m._id !== action.payload.messageId
        );
      }
    },
    setStarredMessages: (state, action: PayloadAction<Message[]>) => {
      state.starredMessages = action.payload;
    },
    addStarredMessage: (state, action: PayloadAction<Message>) => {
      if (!state.starredMessages.find(m => m._id === action.payload._id)) {
        state.starredMessages.push(action.payload);
      }
    },
    removeStarredMessage: (state, action: PayloadAction<string>) => {
      state.starredMessages = state.starredMessages.filter(m => m._id !== action.payload);
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
  markMessageAsRead,
  setReplyingTo,
  clearReplyingTo,
  setPinnedMessages,
  addPinnedMessage,
  removePinnedMessage,
  setStarredMessages,
  addStarredMessage,
  removeStarredMessage,
} = chatSlice.actions;
export default chatSlice.reducer;

export const selectChat = (state: {chat: ChatState}) => state.chat.chats
