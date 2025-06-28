'use client';
import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, Paperclip, Image, MoreVertical, Phone, Video, Edit, Trash2, Smile } from 'lucide-react';
import { RootState } from '@/libs/redux/store';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { FileUpload } from './FileUpload';
import { useSocket } from '@/hooks/useSocket';

interface ChatWindowProps {
  onShowProfile: () => void;
}

export const ChatWindow = ({ onShowProfile }: ChatWindowProps) => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
    const { socket } = useSocket();
  
  const { activeChat, chats, messages } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  const { sendMessage, loadMessages, joinChat, startTyping, stopTyping, markMessagesAsRead, uploadFile } = useChat();

  const currentChat = chats.find(chat => chat.id === activeChat);
  const chatMessages = activeChat ? messages[activeChat] || [] : [];

  useEffect(() => {
    if (activeChat) {
      joinChat(activeChat);
      if (!messages[activeChat] || messages[activeChat].length === 0) {
        setIsLoading(true);
        loadMessages(activeChat).finally(() => setIsLoading(false));
      }
      markMessagesAsRead(activeChat);
    }
  }, [activeChat, messages, loadMessages, joinChat, markMessagesAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const handleTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === activeChat && data.userId !== user?.id) {
        setTypingUsers(prev => [...new Set([...prev, data.userId])]);
      }
    };

    const handleStopTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === activeChat) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    };

    if (socket) {
      socket.on('user_typing', handleTyping);
      socket.on('user_stop_typing', handleStopTyping);
      return () => {
        socket.off('user_typing', handleTyping);
        socket.off('user_stop_typing', handleStopTyping);
      };
    }
  }, [activeChat, user?.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && activeChat) {
      sendMessage(activeChat, message.trim());
      setMessage('');
      stopTyping(activeChat);
    }
  };

  const handleTyping = () => {
    if (activeChat) {
      startTyping(activeChat);
    }
  };

  const handleFileUpload = async (file: File) => {
  if (activeChat) {
    const formData = new FormData();
    formData.append('file', file);
    const data = await uploadFile(formData);
    sendMessage(activeChat, file.name, 'file', data.fileUrl, file.name);
  }
};

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  };

  if (!currentChat) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-semibold">
                {currentChat.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentChat.name || 'Unknown Chat'}
              </h2>
              <p className="text-sm text-gray-500">
                {typingUsers.length > 0
                  ? `${typingUsers.length} user${typingUsers.length > 1 ? 's' : ''} typing...`
                  : currentChat.isGroup
                    ? `${currentChat.participants.length} members`
                    : 'Click to view profile'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
              <Phone size={20} />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
              <Video size={20} />
            </button>
            <button
              onClick={onShowProfile}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoading ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Loading messages...</p>
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-2">👋</div>
            <p>Start your conversation with {currentChat.name}</p>
            <p className="text-sm mt-1">Say hello and break the ice!</p>
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user?.id}
              showAvatar={
                index === 0 ||
                chatMessages[index - 1].senderId !== msg.senderId
              }
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
          >
            <Paperclip size={20} />
          </button>

          <button
            type="button"
            onClick={() => setShowFileUpload(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
          >
            <Image size={20} />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onBlur={() => activeChat && stopTyping(activeChat)}
              placeholder={`Message ${currentChat.name}...`}
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {showFileUpload && (
        <FileUpload
          onUpload={handleFileUpload}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </div>
  );
};