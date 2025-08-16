'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchStory, addViewToStory } from '@/libs/redux/storySlice';
import { AppDispatch, RootState } from '@/libs/redux/store';
import StoryCard from './StoryCard';
import CreateStoryModal from './createStoryModal';
import { PlusIcon, UserIcon } from 'lucide-react';

const StorySection: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const router = useRouter();
  const {user } = useSelector((state: RootState) => state.auth)
  const { stories } = useSelector((state: RootState) => state.stories);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Fetch reels when component mounts
    dispatch(fetchStory({ page: 1, limit: 50 }));
  }, [dispatch]);

  // // Open modal when there's an error
  // useEffect(() => {
  //   if (error) {
  //     setIsModalOpen(true);
  //   }
  // }, [error]);

  const handleReelClick = (reelId: string) => {
    // Call API to add view when reel is clicked
    dispatch(addViewToStory(reelId));
    // Navigate to full reel view
    router.push(`/stories/${reelId}`);
  };

  const handleCreateStory = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Stories</h2>
      </div>
      
      {/* Horizontal scrollable reels */}
      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Create Reel Button - Always first */}
        <div className="flex-shrink-0">
          <div 
            onClick={handleCreateStory}
            className="relative w-32 h-48 bg-white rounded-xl border border-gray-200 cursor-pointer overflow-hidden group hover:shadow-md transition-all duration-200"
          >
            {/* User profile background */}
            <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 relative">
              {user?.avatar? (
                <img 
                  src={user.avatar} 
                  alt="Your profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <UserIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              {/* Plus icon overlay */}
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg group-hover:bg-blue-600 transition-colors">
                  <PlusIcon className="h-4 w-4 text-white font-bold" />
                </div>
              </div>
            </div>
            <div className="p-2 pt-4 text-center">
              <span className="text-xs font-medium text-gray-900 leading-tight">Create Story</span>
            </div>
          </div>
        </div>
        
        {/* Reels */}
        {stories.map((story) => (
          <div key={story._id} className="flex-shrink-0">
            <div
              onClick={() => handleReelClick(story._id)}
              className="cursor-pointer w-28 h-40 transform hover:scale-105 transition-transform"
            >
              <StoryCard story={story} isCompact={true} />
            </div>
          </div>
        ))}
      </div>
      
      {/* Create Reel Modal */}
      <CreateStoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default StorySection;