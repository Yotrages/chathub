'use client';

import React from 'react';
import { XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';

interface ReelViewersProps {
  storyId: string;
  viewers: Array<{
    _id: string;
    username: string;
    avatar?: string;
    // viewedAt: string;
  }>;
  viewersCount: number;
  isOwner: boolean;
  onClose: () => void;
}

const ReelViewers: React.FC<ReelViewersProps> = ({ 
  viewers, 
  viewersCount, 
  isOwner, 
  onClose 
}) => {
  if (!isOwner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-md w-full mx-4 max-h-[70vh] overflow-hidden transition-colors duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center dark:text-gray-100">
            <EyeIcon className="h-5 w-5 mr-2" />
            Viewers ({viewersCount})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-96 dark:bg-gray-800">
          {viewers.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No viewers yet</p>
          ) : (
            <div className="space-y-3">
              {viewers.map((viewer) => (
                <div key={viewer._id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <img
                    src={viewer.avatar || ''}
                    alt={viewer.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-medium dark:text-gray-100">{viewer.username}</p>
                    {/* <p className="text-sm text-gray-500">
                      {new Date(viewer.viewedAt).toLocaleString()}
                    </p> */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReelViewers;
