"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStory,
  setStoryViewers,
  addReactionToStory,
  getStoryViewers,
} from "@/libs/redux/storySlice";
import { RootState, AppDispatch } from "@/libs/redux/store";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import StoryCard from "@/components/story/StoryCard";
import StoryNavigation from "@/components/story/StoryNavigation";
import EmojiReactions from "@/components/story/EmojiReactions";
import toast from "react-hot-toast";
import { EyeIcon, MoreHorizontal } from "lucide-react";
import { StoriesContextMenu } from "@/components/story/StoriesContextMenu";
import StoryViewers from "@/components/story/ViewersModal";

const StoriesPage: React.FC = () => {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const params = useParams();
  const { id } = params || {};
  const dispatch: AppDispatch = useDispatch();
  const { stories, loading, error } = useSelector(
    (state: RootState) => state.stories
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const [showViewers, setShowViewers] = useState(false);

  const storyId = id as string;
  const currentStory = stories.find((story) => story._id === storyId);
  const currentIndex = stories.findIndex((story) => story._id === storyId);

  const hasNext = currentIndex < stories.length - 1;
  const hasPrevious = currentIndex > 0;

  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  useEffect(() => {
    if (stories.length === 0) {
      dispatch(fetchStory({ page: 1, limit: 50 }));
    }

    if (storyId) {
      dispatch(setStoryViewers(storyId));
      if (currentStory && user?._id === currentStory.authorId._id) {
        dispatch(getStoryViewers(storyId));
      }
    }
  }, [storyId]);

  useEffect(() => {
    let startY = 0;
    let startX = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      const endX = e.changedTouches[0].clientX;
      const deltaY = startY - endY;
      const deltaX = startX - endX;
      
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
        if (deltaY > 0 && hasNext) {
          handleNext();
        } else if (deltaY < 0 && hasPrevious) {
          handlePrevious();
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasNext, hasPrevious, currentIndex]);

  if (!storyId) {
    toast.error("story not found");
    router.back();
    return;
  }

  const handleReaction = (emoji: string) => {
    dispatch(addReactionToStory({ storyId, reactionType: emoji }));
  };

  const handleNext = () => {
    if (hasNext) {
      const nextStoryId = stories[currentIndex + 1]._id;
      router.push(`/stories/${nextStoryId}`);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      const prevStoryId = stories[currentIndex - 1]._id;
      router.push(`/stories/${prevStoryId}`);
    }
  };

  if (loading && stories.length === 0) {
    return (
      <div 
        className="bg-black flex items-center justify-center"
        style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading stories...</p>
        </div>
      </div>
    );
  }
  
  if (!currentStory) {
    return (
      <div 
        className="bg-black flex items-center justify-center"
        style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}
      >
        <div className="text-center">
          <p className="text-white mb-4">{error || "Story not found"}</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }
  
  const isOwner = user?._id === currentStory.authorId._id;
  const handleViewersClick = () => {
    if (isOwner && currentStory.viewers) {
      setShowViewers(true);
    }
  };

  return (
    <div 
      className="w-full bg-black flex flex-col items-center justify-center relative overflow-hidden"
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
    >
      {/* Header - Responsive */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-2 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 bg-black bg-opacity-30">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img
              src={currentStory.authorId.avatar}
              alt={currentStory.authorId.username}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white"
            />
            <div className="flex flex-col items-start">
              <p className="text-white font-semibold text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">
                {currentStory.authorId.username}
              </p>
              <p className="text-gray-300 text-[10px] sm:text-xs hidden sm:block">
                {new Date(currentStory.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Story counter - hide on very small screens */}
          <div className="hidden xs:block bg-black bg-opacity-50 rounded-full px-2 sm:px-3 py-1">
            <span className="text-white text-xs sm:text-sm">
              {currentIndex + 1} / {stories.length}
            </span>
          </div>
          
          {/* More options */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="p-1.5 sm:p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors bg-black bg-opacity-30"
            >
              <MoreHorizontal size={18} className="text-white sm:w-5 sm:h-5"/>
            </button>
            {showDropdown && (
              <StoriesContextMenu 
                showDropdown={showDropdown} 
                setShowDropdown={setShowDropdown} 
                authorId={currentStory.authorId} 
                storyId={currentStory._id}
              />
            )}
          </div>
          
          {/* Close button */}
          <button 
            onClick={() => router.back()} 
            className="text-white hover:text-gray-300 p-1.5 sm:p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors bg-black bg-opacity-30"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
      </div>

      {/* Main Story Display */}
      <div className="w-full h-full max-w-md py-2 mx-auto relative">
        <StoryCard
          story={currentStory}
          isFullscreen={true}
        />
      </div>

      {/* Navigation */}
      <StoryNavigation
        currentIndex={currentIndex}
        totalStories={stories.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
      />

      {/* Bottom Action Bar - Responsive */}
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 z-30 flex items-center justify-between">
        {/* Left side - Viewers */}
        <button
          onClick={handleViewersClick}
          className={`${isOwner ? 'flex' : 'hidden'} items-center space-x-1.5 sm:space-x-2 bg-black bg-opacity-40 backdrop-blur-sm rounded-full px-2.5 sm:px-3 py-1.5 sm:py-2 hover:bg-opacity-60 transition-all`}
        >
          <EyeIcon className="text-white h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="text-white text-xs sm:text-sm font-medium">{currentStory.viewers?.length}</span>
        </button>

        {/* Right side - Emoji Reactions */}
        <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-1">
          <EmojiReactions onEmojiSelect={handleReaction} />
        </div>
      </div>

      {showViewers && currentStory.viewers && (
        <StoryViewers
          storyId={currentStory._id}
          viewers={currentStory.viewers}
          viewersCount={currentStory.viewers?.length}
          isOwner={isOwner}
          onClose={() => setShowViewers(false)}
        />
      )}
    </div>
  );
};

export default StoriesPage;