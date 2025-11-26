'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import InfiniteScroll from 'react-infinite-scroll-component';
import { fetchStory, resetStory } from '@/libs/redux/storySlice';
import CreateReelModal from '@/components/reels/createReelModal';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { AppDispatch, RootState } from '@/libs/redux/store';
import StoryCard from '@/components/story/StoryCard';

const ReelsPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { stories, loading, hasMore, page, error } = useSelector((state: RootState) => state.stories);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(resetStory());
    dispatch(fetchStory({ page: 1, limit: 20 }));
    return () => {
      dispatch(resetStory());
    };
  }, [dispatch]);

  const loadMore = () => {
    if (!loading && hasMore) {
      dispatch(fetchStory({ page, limit: 20 }));
    }
  };

  // const handleLike = (reelId: string) => {
  //   dispatch(likeStory(reelId));
  // };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center py-4 transition-colors duration-200">
      <div className="w-full max-w-md px-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reels</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-colors"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Create Reel
          </button>
        </div>
        {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
        <InfiniteScroll
          dataLength={stories.length}
          next={loadMore}
          hasMore={hasMore}
          loader={<p className="text-center py-4 text-gray-700 dark:text-gray-400">Loading...</p>}
          endMessage={<p className="text-center py-4 text-gray-700 dark:text-gray-400">No more reels to show</p>}
          className="space-y-4"
        >
          {stories.map((story) => (
            <StoryCard key={story._id} story={story} />
          ))}
        </InfiniteScroll>
      </div>
      <CreateReelModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default ReelsPage;