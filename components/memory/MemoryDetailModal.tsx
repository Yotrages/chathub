import React, { useEffect, useState } from 'react';
import { X, Calendar, Hash, MessageCircle, Heart, Share, Clock, Brain, Sparkles } from 'lucide-react';
import { MemoryThread } from '@/types';
import { UserAvatar } from '../constant/UserAvatar';
import { api } from '@/libs/axios/config';

interface MemoryContextItem {
  _id: string;
  content: string;
  authorId: {
    _id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
  type: 'post' | 'comment';
  reactions?: any[];
  commentsCount?: number;
  shareCount?: number;
}

interface MemoryDetailModalProps {
  memory: MemoryThread | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryDetailModal: React.FC<MemoryDetailModalProps> = ({
  memory,
  isOpen,
  onClose
}) => {
  const [memoryDetails, setMemoryDetails] = useState<MemoryContextItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && memory) {
      fetchMemoryDetails();
    }
  }, [isOpen, memory]);

  const fetchMemoryDetails = async () => {
    if (!memory) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/memory-threads/${memory._id}/details`);
      
      if (response.status === 200) {
        const data = response.data;
        setMemoryDetails(data.contextItems || []);
      }
    } catch (error) {
      console.error('Error fetching memory details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeDate = (date: string) => {
    const now = new Date();
    const itemDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const relevancePercentage = memory ? Math.round(memory.relevanceScore * 100) : 0;

  if (!isOpen || !memory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Brain size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Memory Thread</h2>
                <div className="flex items-center gap-3 text-purple-100">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {formatRelativeDate(memory.lastActivity)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={14} />
                    {memory.relatedPosts.length} interactions
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={14} />
                    {relevancePercentage}% relevant
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-200px)]">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-6 transition-colors duration-200">
            <div className="space-y-6">
              {/* Context Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <Brain size={18} className="text-purple-600" />
                  Memory Context
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-purple-400 transition-colors duration-200">
                  {memory.context}
                </p>
              </div>

              {/* Keywords */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <Hash size={18} className="text-blue-600" />
                  Key Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {memory.keywords.map((keyword, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-gradient-to-r from-blue-100 dark:from-blue-900/40 to-purple-100 dark:to-purple-900/40 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/50 transition-colors duration-200"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Timeline Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <Calendar size={18} className="text-green-600" />
                  Timeline
                </h3>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg space-y-2 transition-colors duration-200">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Started:</span> {formatRelativeDate(memory.createdAt)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Last Activity:</span> {formatRelativeDate(memory.lastActivity)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Duration:</span> {
                      Math.floor((new Date(memory.lastActivity).getTime() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    } days
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <MessageCircle size={20} className="text-indigo-600" />
                Conversation History
              </h3>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {memoryDetails.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Brain size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No detailed history available</p>
                      <p className="text-sm">This memory thread doesn&apos;t have accessible conversation details.</p>
                    </div>
                  ) : (
                    memoryDetails.map((item, index) => (
                      <div key={item._id} className="relative">
                        {index > 0 && (
                          <div className="absolute left-6 -top-3 w-0.5 h-6 bg-gradient-to-b from-purple-200 to-transparent"></div>
                        )}
                        
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-start gap-4">
                            <UserAvatar
                              username={item.authorId.username}
                              avatar={item.authorId.avatar}
                              className="w-10 h-10 flex-shrink-0"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h4 className="font-semibold text-gray-800">
                                  {item.authorId.username}
                                </h4>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  item.type === 'post' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {item.type}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(item.createdAt)}
                                </span>
                              </div>
                              
                              <p className="text-gray-700 leading-relaxed mb-4">
                                {item.content}
                              </p>

                              {item.type === 'post' && (
                                <div className="flex items-center gap-6 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Heart size={14} />
                                    {item.reactions?.length || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageCircle size={14} />
                                    {item.commentsCount || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Share size={14} />
                                    {item.shareCount || 0}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              This memory thread helps you maintain context in your conversations
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
