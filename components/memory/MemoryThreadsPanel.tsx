import React, { useState } from 'react';
import { MemoryThread } from '@/types';
import { MemoryThreadCard } from './MemoryThreadCard';
import { MemoryDetailModal } from './MemoryDetailModal';
import { Brain, Sparkles } from 'lucide-react';

interface MemoryThreadsPanelProps {
  memories: MemoryThread[];
  isLoading: boolean;
  onExpandMemory: (memory: MemoryThread) => void;
  participantUsername?: string;
}

export const MemoryThreadsPanel: React.FC<MemoryThreadsPanelProps> = ({
  memories,
  isLoading,
  onExpandMemory,
  participantUsername
}) => {
  const [selectedMemory, setSelectedMemory] = useState<MemoryThread | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExpandMemory = (memory: MemoryThread) => {
    setSelectedMemory(memory);
    setIsModalOpen(true);
    onExpandMemory(memory);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMemory(null);
  };

  if (isLoading) {
    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 dark:from-gray-800/50 to-blue-50 dark:to-gray-800/30 rounded-xl border border-purple-200 dark:border-purple-900/50 transition-colors duration-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-purple-400 dark:bg-purple-600 rounded-full flex items-center justify-center animate-pulse">
            <Brain size={14} className="text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">
            Searching memories...
          </span>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-30 rounded-lg p-3 animate-pulse transition-colors duration-200">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (memories.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 dark:from-gray-800/50 to-blue-50 dark:to-gray-800/30 rounded-xl border-l-4 border-purple-400 dark:border-purple-600 transition-colors duration-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-200">
            💭 Memories with {participantUsername || 'this person'}
          </h4>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-800">
          {memories.slice(0, 4).map((memory) => (
            <MemoryThreadCard
              key={memory._id}
              memory={memory}
              onExpand={handleExpandMemory}
            />
          ))}
        </div>

        {memories.length > 4 && (
          <div className="text-center mt-3 pt-3 border-t border-purple-200">
            <button className="text-sm text-purple-600 hover:text-purple-800 font-medium hover:underline transition-colors">
              View all {memories.length} memory threads
            </button>
          </div>
        )}
      </div>

      <MemoryDetailModal
        memory={selectedMemory}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};
