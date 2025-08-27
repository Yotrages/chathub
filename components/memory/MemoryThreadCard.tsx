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
  const getRelevanceColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 bg-green-50';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-3 cursor-pointer hover:shadow-lg hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
            <Brain size={16} className="text-white" />
          </div>
          <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            Memory Thread
          </span>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full ${getRelevanceColor(memory.relevanceScore)}`}>
          {relevancePercentage}% match
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
          {memory.context}
        </p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar size={12} />
          {formatDate(memory.lastActivity)}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {memory.keywords.slice(0, 3).map((keyword, index) => (
          <span 
            key={index}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"
          >
            <Hash size={10} />
            {keyword}
          </span>
        ))}
        {memory.keywords.length > 3 && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            +{memory.keywords.length - 3} more
          </span>
        )}
      </div>

      <button
        onClick={() => onExpand(memory)}
        className="w-full text-xs text-purple-600 hover:text-purple-800 font-medium bg-white bg-opacity-50 py-2 rounded-lg hover:bg-opacity-70 transition-all duration-200"
      >
        View full conversation history →
      </button>
    </div>
  );
};
