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
    dispatch(fetchStory({ page: 1, limit: 50 }));
  }, []);

  const handleReelClick = (reelId: string) => {
    dispatch(addViewToStory(reelId));
    router.push(`/stories/${reelId}`);
  };

  const handleCreateStory = () => {
    if (window.innerWidth <= 768) {
      router.push('/stories/create')
    } else {
            setIsModalOpen(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm py-4 px-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Stories</h2>
      </div>
      
      <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex-shrink-0">
          <div 
            onClick={handleCreateStory}
            className="relative w-24 xs:w-32 h-48 bg-white rounded-xl border border-gray-200 cursor-pointer overflow-hidden group hover:shadow-md transition-all duration-200"
          >
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
        
        {stories.map((story) => (
          <div key={story._id} className="flex-shrink-0">
            <div
              onClick={() => handleReelClick(story._id)}
              className="cursor-pointer transform hover:scale-105 transition-transform"
            >
              <StoryCard story={story} isCompact={true} />
            </div>
          </div>
        ))}
      </div>
      
      <CreateStoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default StorySection;