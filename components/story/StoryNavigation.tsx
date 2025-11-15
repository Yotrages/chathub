'use client';

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ReelNavigationProps {
  currentIndex: number;
  totalStories: number;
  onPrevious: () => void;
  onNext: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

const StoryNavigation: React.FC<ReelNavigationProps> = ({
  // currentIndex,
  // totalStories,
  onPrevious,
  onNext,
  hasNext,
  hasPrevious
}) => {
  return (
    <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none z-10">
      {hasPrevious && (
        <button
          onClick={onPrevious}
          className="ml-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all pointer-events-auto"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
      )}
      
      <div className="flex-1" />
      
      {hasNext && (
        <button
          onClick={onNext}
          className="mr-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all pointer-events-auto"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default StoryNavigation;
