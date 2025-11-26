import React from 'react';
import { Brain, Calendar, Hash } from 'lucide-react';
import { MemoryThread } from '@/types';

interface MemoryThreadCardProps {
  memory: MemoryThread;
  onExpand: (memory: MemoryThread) => void;
}

export const MemoryThreadCard: React.FC<MemoryThreadCardProps> = ({ 
  memory, 
  onExpand 
}) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const relevancePercentage = Math.round(memory.relevanceScore * 100);
  // const getRelevanceColor = (score: number) => {
  //   if (score >= 0.7) return 'text-green-600 bg-green-50';
  //   if (score >= 0.4) return 'text-yellow-600 bg-yellow-50';
  //   return 'text-gray-600 bg-gray-50';
  // };

  return (
    <div className="bg-gradient-to-r from-purple-50 dark:from-gray-800/50 via-blue-50 dark:via-gray-700/30 to-indigo-50 dark:to-gray-800/50 border border-purple-200 dark:border-purple-900/50 rounded-xl p-4 mb-3 cursor-pointer hover:shadow-lg dark:hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
            <Brain size={16} className="text-white" />
          </div>
          <span className="text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full transition-colors duration-200">
            Memory Thread
          </span>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full ${
          memory.relevanceScore >= 0.7 
            ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
            : memory.relevanceScore >= 0.4
            ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30'
            : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30'
        } transition-colors duration-200`}>
          {relevancePercentage}% match
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed transition-colors duration-200">
          {memory.context}
        </p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
          <Calendar size={12} />
          {formatDate(memory.lastActivity)}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {memory.keywords.slice(0, 3).map((keyword, index) => (
          <span 
            key={index}
            className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full flex items-center gap-1 transition-colors duration-200"
          >
            <Hash size={10} />
            {keyword}
          </span>
        ))}
        {memory.keywords.length > 3 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full transition-colors duration-200">
            +{memory.keywords.length - 3} more
          </span>
        )}
      </div>

      <button
        onClick={() => onExpand(memory)}
        className="w-full text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 py-2 rounded-lg hover:bg-opacity-70 dark:hover:bg-opacity-70 transition-all duration-200"
      >
        View full conversation history →
      </button>
    </div>
  );
};
