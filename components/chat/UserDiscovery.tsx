'use client';
import { useState } from 'react';
import { Globe, MessageSquare, Shield, Star, Users, X, Zap, SearchIcon } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { useChat } from '@/hooks/useChat';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';

interface UserDiscoveryProps {
  onClose: () => void;
}

export const UserDiscovery = ({ onClose }: UserDiscoveryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { data: users, isLoading } = useFetch('/auth/users');
  const { createChat } = useChat();
  const { user } = useSelector((state: RootState) => state.auth);

  const categories = [
    { id: 'all', name: 'All Users', icon: Globe },
    { id: 'online', name: 'Online', icon: Zap },
    { id: 'suggested', name: 'Suggested', icon: Star },
    { id: 'verified', name: 'Verified', icon: Shield },
    { id: 'recent', name: 'Recently Active', icon: Zap },
    { id: 'mutual', name: 'Mutual Connections', icon: Users },
  ];

  const handleStartChat = async (userId: string) => {
    if (!user?._id) return;
    await createChat([userId], 'direct');
    onClose();
  };

  const filteredUsers = users?.filter((u: any) => {
    if (!u || u._id === user?._id) return false; 
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'online' && u.status === 'online') ||
      (selectedCategory === 'suggested' && u.isSuggested) ||
      (selectedCategory === 'verified' && u.isVerified) ||
      (selectedCategory === 'recent' && new Date(u.lastSeen).getTime() > Date.now() - 24 * 60 * 60 * 1000) || 
      (selectedCategory === 'mutual' && u.mutualConnections?.length > 0); 
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <div className="w-80 bg-white border-l border-gray-200/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Discover
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-all"
          >
            <X />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 transform  -translate-y-1/2 text-black" size={20} />
          <input
          id='search'
            type="text"
            placeholder="Find people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/70 backdrop-blur-[0.5px] border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </div>

        {/* Categories */}
        <div className="mt-4 space-y-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl text-left transition-all ${
                  selectedCategory === category.id
                    ? 'bg-white shadow-sm text-purple-600'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Finding people...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Users className="mx-auto mb-2 text-gray-300" size={48} />
            <p>No users found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u: any) => (
              <div
                key={u._id}
                className="flex items-center p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl hover:shadow-lg transition-all duration-200 group cursor-pointer border border-gray-100/50"
              >
                <div className="relative mr-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                    <span className="text-white font-semibold">
                      {u.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                      u.status === 'online'
                        ? 'bg-green-400'
                        : u.status === 'away'
                        ? 'bg-yellow-400'
                        : 'bg-gray-400'
                    }`}
                  ></div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{u.username}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
                <button
                  onClick={() => handleStartChat(u._id)}
                  className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};