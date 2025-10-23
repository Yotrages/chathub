'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Plus, Users, MessageSquare, Trash2 } from 'lucide-react';
import { AppDispatch, RootState } from '@/libs/redux/store';
import { setActiveChat } from '@/libs/redux/chatSlice';
import { useChat } from '@/hooks/useChat';
import { NewChatModal } from './NewChatModal';
import { UserAvatar } from '../constant/UserAvatar';
import { useRouter } from 'next/navigation';

export const ChatSidebar = ({isHomepage} : {isHomepage?: boolean}) => {
  const dispatch: AppDispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'groups'>('all');
  const router = useRouter()

  const { chats, isLoading } = useSelector((state: RootState) => state.chat);
  const { deleteChat } = useChat();

    useEffect(() => {
      document.body.style.overflow = 'hidden'
    }, [showNewChat])

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.participants.some(p => p.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTab = activeTab === 'all' || (activeTab === 'groups' && chat.type === 'group');
    return matchesSearch && matchesTab;
  });

  const handleChatSelect = (chatId: string) => {
    dispatch(setActiveChat(chatId));
    if (isHomepage) {
      router.push(`/chat`)
    }
  };

  const messageWindow = () => {
     router.push("/message")
  }
  const handleDeleteChat = async (chatId: string) => {
    if (confirm('Are you sure you want to delete/leave this chat?')) {
      await deleteChat(chatId);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      <div className="flex flex-col w-full h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl dark:text-white font-semibold">Chats</h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tabs */}
          <div className="flex mt-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare size={16} className="inline mr-2" />
              All
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'groups'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users size={16} className="inline mr-2" />
              Groups
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading chats...</div>
          ) : filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? 'No chats found' : 'No conversations yet'}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat._id}
                onClick={() => {
                  handleChatSelect(chat._id)
                  if (screen.width < 768) {
                    messageWindow()
                  }
                }}
                className="flex items-center justify-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors relative group"
              >
                {/* Avatar */}
                <div className="flex-shrink-0 mr-3">
                  {chat.type === 'group' ? (
                    <>
                    {chat?.avatar ? (
                      <div className='w-12 h-12'>
                        <UserAvatar username={chat.name} avatar={chat.avatar} className='w-12 h-12'/>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <Users className="text-white" size={20} />
                    </div>
                    )}
                    </>
                  ) : (
                    <>
                    {chat?.avatar ? (
                      <div className='w-12 h-12'>
                        <UserAvatar username={chat.name} avatar={chat.avatar} className='w-12 h-12'/>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {chat.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    )}
                    </>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {chat.name || 'Unknown Chat'}
                    </h3>
                    {chat.lastMessageTime && (
                      <span className="text-xs text-gray-500">
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 truncate">
                      {chat.lastMessage?.content || 'No messages yet'}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Chat Actions */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteChat(chat._id)}
                    className="p-2 text-gray-500 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showNewChat && (
        <NewChatModal onClose={() => setShowNewChat(false)} />
      )}
    </>
  );
};