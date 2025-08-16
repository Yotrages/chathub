'use client';

import React from 'react';
import { XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';

interface ReelViewersProps {
  reelId: string;
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
    <div className="fixed bottom-0 inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4 max-h-[70vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <EyeIcon className="h-5 w-5 mr-2" />
            Viewers ({viewersCount})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-96">
          {viewers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No viewers yet</p>
          ) : (
            <div className="space-y-3">
              {viewers.map((viewer) => (
                <div key={viewer._id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <img
                    src={viewer.avatar || '/default-avatar.png'}
                    alt={viewer.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{viewer.username}</p>
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
