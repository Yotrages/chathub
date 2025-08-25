"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStory,
  likeStory,
  setStoryViewers,
  addReactionToStory,
  getStoryViewers,
} from "@/libs/redux/storySlice";
import { RootState, AppDispatch } from "@/libs/redux/store";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import StoryCard from "@/components/story/StoryCard";
import StoryNavigation from "@/components/story/StoryNavigation";
import ReelViewers from "@/components/story/ViewersModal";
import EmojiReactions from "@/components/story/EmojiReactions";
import toast from "react-hot-toast";
import { EyeIcon, MoreHorizontal } from "lucide-react";
import { StoriesContextMenu } from "@/components/story/StoriesContextMenu";

const StoriesPage: React.FC = () => {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false)
  const params = useParams();
  const { id } = params || {};
  const dispatch: AppDispatch = useDispatch();
  const { stories, loading, error } = useSelector(
    (state: RootState) => state.stories
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const [showViewers, setShowViewers] = useState(false);

  const reelId = id as string;
  const currentStory = stories.find((story) => story._id === reelId);
  const currentIndex = stories.findIndex((reel) => reel._id === reelId);

  const hasNext = currentIndex < stories.length - 1;
  const hasPrevious = currentIndex > 0;

  
  useEffect(() => {
    if (stories.length === 0) {
      dispatch(fetchStory({ page: 1, limit: 50 }));
    }

    if (reelId) {
      dispatch(setStoryViewers(reelId));
      // Fetch viewers for the owner
      if (currentStory && user?._id === currentStory.authorId._id) {
        dispatch(getStoryViewers(reelId));
      }
    }
  }, [reelId]);

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

  if (!reelId) {
    toast.error("story not found")
    router.back()
    return;
  }
  const handleLike = (reelId: string) => {
    dispatch(likeStory(reelId));
  };

  const handleReaction = (emoji: string) => {
    dispatch(addReactionToStory({ reelId, reactionType: emoji }));
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

  // Touch/Swipe handlers
  
  if (loading && stories.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading stories...</p>
        </div>
      </div>
    );
  }
  
  if (!currentStory) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4">
        <div className="flex items-center gap-3 backdrop-blur-sm rounded-lg p-2">
          <div className="flex items-center space-x-3">
            <img
              src={currentStory.authorId.avatar}
              alt={currentStory.authorId.username}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div className="flex flex-col items-start">
              <p className="text-white font-semibold text-sm">
                {currentStory.authorId.username}
              </p>
              <p className="text-gray-300 text-xs">
                {new Date(currentStory.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-black bg-opacity-50 rounded-full px-3 py-1">
            <span className="text-white text-sm">
              {currentIndex + 1} / {stories.length}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center relative">
          <button
          onClick={() => setShowDropdown((prev) => !prev)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreHorizontal size={20} className="text-gray-500"/>
          </button>
          {showDropdown && (
            <StoriesContextMenu showDropdown={showDropdown} setShowDropdown={setShowDropdown} authorId={currentStory.authorId} storyId={currentStory._id}/>
          )}
          </div>
          <button onClick={() => router.back()} className="text-white hover:text-gray-300">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main Story Display */}
      <div className="w-full h-full max-w-md mx-auto relative">
        <StoryCard
          story={currentStory}
          onLike={handleLike}
          onReaction={handleReaction}
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

      {/* Bottom Action Bar - Facebook Style */}
      <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between">
        {/* Left side - Viewers */}
        <button
          onClick={handleViewersClick}
          className="flex items-center space-x-2 bg-black bg-opacity-40 backdrop-blur-sm rounded-full px-3 py-2 hover:bg-opacity-60 transition-all"
        >
          <EyeIcon className="text-white h-4 w-4" />
          <span className="text-white text-sm font-medium">{currentStory.viewers?.length}</span>
        </button>

        {/* Right side - Emoji Reactions */}
        <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-full px-2 py-1">
          <EmojiReactions onEmojiSelect={handleReaction} />
        </div>
      </div>

      {showViewers && currentStory.viewers && (
        <ReelViewers
          reelId={currentStory._id}
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