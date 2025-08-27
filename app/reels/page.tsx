"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import ReelCard from "@/components/reels/ReelCard";
  import { debounce } from "lodash";

import CreateReelModal from "@/components/reels/createReelModal";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { RootState } from "@/libs/redux/store";
import { useGetReels, useReactReel } from "@/hooks/useReels";

const ReelsPage: React.FC = () => {
  const {
    reels,
    pagination,
    isLoading: reelsLoading,
  } = useSelector((state: RootState) => state.reels);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const { trigger } = useGetReels(pagination.reels?.currentPage || 1);
  const { mutate: reactToReel } = useReactReel(reels[currentIndex]?._id || "");

  const hasMore = pagination.reels?.hasNextPage ?? false;

  useEffect(() => {
    if (reels.length > 0 && !reelsLoading && currentIndex >= reels.length) {
      setCurrentIndex(reels.length - 1);
    }
    if (hasMore && !reelsLoading) {
      trigger();
    }
  }, [currentIndex, reelsLoading, hasMore, reels.length, trigger]);

 useEffect(() => {
  let startY = 0;
  let startTime = 0;

  const handleTouchStart = (e: TouchEvent) => {
    startY = e.touches[0].clientY;
    startTime = Date.now();
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!startY) return;
    
    const endY = e.changedTouches[0].clientY;
    const deltaY = startY - endY;
    const deltaTime = Date.now() - startTime;
    
    // Minimum swipe distance and maximum time for a valid swipe
    const minSwipeDistance = 50;
    const maxSwipeTime = 300;
    
    if (Math.abs(deltaY) > minSwipeDistance && deltaTime < maxSwipeTime) {
      if (deltaY > 0 && currentIndex < reels.length - 1) {
        // Swiped up (next reel)
        setCurrentIndex((prev) => prev + 1);
      } else if (deltaY < 0 && currentIndex > 0) {
        // Swiped down (previous reel)
        setCurrentIndex((prev) => prev - 1);
      }
    }
    
    // Reset
    startY = 0;
    startTime = 0;
  };

  document.addEventListener("touchstart", handleTouchStart, { passive: true });
  document.addEventListener("touchend", handleTouchEnd, { passive: true });
  
  return () => {
    document.removeEventListener("touchstart", handleTouchStart);
    document.removeEventListener("touchend", handleTouchEnd);
  };
}, [currentIndex, reels.length]);

// Optional: Add keyboard navigation
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp" && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (e.key === "ArrowDown" && currentIndex < reels.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [currentIndex, reels.length]);



// Inside the component
useEffect(() => {
  const handleWheel = debounce((e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (e.deltaY > 0 && currentIndex < reels.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, 200); // 200ms debounce

  document.addEventListener("wheel", handleWheel, { passive: false });
  return () => {
    document.removeEventListener("wheel", handleWheel);
    handleWheel.cancel(); // Cancel debounce on cleanup
  };
}, [currentIndex, reels.length]);


  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video && index === currentIndex) {
        video.play().catch(() => {});
      } else if (video) {
        video.pause();
      }
    });
  }, [currentIndex]);

  const handleReaction = (reelId: string, emoji: string, name: string) => {
    reactToReel({ emoji, name });
  };

  if (reelsLoading && reels.length === 0) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-white">Loading reels...</p>
      </div>
    </div>
  );
}

else if (reels.length === 0) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <p className="text-white">No reels yet. Be the first to post!</p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-full"
        >
          Create Reel
        </button>
      </div>
      <CreateReelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}


  return (
    <div className="min-h-screen bg-black">
      <div className="fixed top-0 left-0 w-full z-10 bg-black bg-opacity-50 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Reels</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-full"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Create Reel
        </button>
      </div>
      <div className="flex justify-center">
        {reels.map((reel, index) => (
          <div
            key={reel?._id}
            className={`w-full max-w-3xl mx-auto ${
              index === currentIndex ? "block" : "hidden"
            }`}
            style={{ height: "100vh" }}
          >
            <ReelCard
              reel={reel}
              onReaction={handleReaction}
              isFullscreen={true}
              ref={(el) => {
                if (el) videoRefs.current[index] = el.querySelector("video");
              }}
            />
          </div>
        ))}
      </div>
      <CreateReelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default ReelsPage;
