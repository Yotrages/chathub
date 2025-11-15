"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import ReelCard from "@/components/reels/ReelCard";
import { ReelCardRef } from "@/components/reels/ReelCard";
import { debounce } from "lodash";
import CreateReelModal from "@/components/reels/createReelModal";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { useGetReels, useReactReel } from "@/hooks/useReels";
import {
  selectReelsArray,
  selectReelsPagination,
  selectReelsLoading,
} from "@/libs/redux/reelsSlice";
import { useRouter } from "next/navigation";

const ReelsPage: React.FC = () => {
  const reels = useSelector(selectReelsArray);
  const pagination = useSelector(selectReelsPagination);
  const reelsLoading = useSelector(selectReelsLoading);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const reelRefs = useRef<(ReelCardRef | null)[]>([]);
  const router = useRouter();

  const currentPage = pagination.reels?.currentPage || 1;

  const { trigger, isLoading } = useGetReels(currentPage);

  const currentReelId = reels[currentIndex]?._id || "";
  const { mutate: reactToReel } = useReactReel(currentReelId);

  const hasMore = pagination.reels?.hasNextPage ?? false;

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
    if (!hasInitialized && !reelsLoading) {
      console.log("Initial load triggered");
      trigger();
      setHasInitialized(true);
    }
  }, [hasInitialized, reelsLoading, trigger]);

  useEffect(() => {
    if (
      hasMore &&
      !reelsLoading &&
      reels.length > 0 &&
      currentIndex >= reels.length - 2
    ) {
      console.log("Loading more reels...");
      trigger();
    }
  }, [currentIndex, isLoading, hasMore, reels.length, trigger]);

  useEffect(() => {
    if (reels.length > 0 && currentIndex >= reels.length) {
      setCurrentIndex(reels.length - 1);
    }
  }, [reels.length, currentIndex]);

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

      const minSwipeDistance = 50;
      const maxSwipeTime = 300;

      if (Math.abs(deltaY) > minSwipeDistance && deltaTime < maxSwipeTime) {
        if (deltaY > 0 && currentIndex < reels.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else if (deltaY < 0 && currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      }

      startY = 0;
      startTime = 0;
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentIndex, reels.length]);

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

  useEffect(() => {
    const handleWheel = debounce((e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else if (e.deltaY > 0 && currentIndex < reels.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 200);

    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      document.removeEventListener("wheel", handleWheel);
      handleWheel.cancel();
    };
  }, [currentIndex, reels.length]);

  useEffect(() => {
    reelRefs.current.forEach((reelRef, index) => {
      if (reelRef) {
        const video = reelRef.getVideoElement();
        if (video) {
          if (index === currentIndex) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      }
    });
  }, [currentIndex]);

  const handleReaction = (reelId: string, emoji: string, name: string) => {
    reactToReel({ emoji, name });
  };

  if (isLoading && !reels.length) {
    return (
      <div 
        className="bg-black flex items-center justify-center"
        style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading reels...</p>
        </div>
      </div>
    );
  }

  if (!isLoading && reels.length === 0) {
    return (
      <div 
        className="bg-black flex items-center justify-center"
        style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}
      >
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
    <div 
      className="bg-black"
      style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}
    >
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 w-full z-30 bg-black bg-opacity-50 backdrop-blur-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl sm:visible invisible font-bold text-white">Reels</h1>
        <button
          onClick={() => window.innerWidth <= 768 ? router.push(`/reels/create`) : setIsModalOpen(true)}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Create Reel
        </button>
      </div>

      <div 
        className="relative w-full overflow-hidden"
        style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
      >
        {reels.map((reel, index) => (
          <div
            key={reel?._id ?? `reel-fallback-${index}`}
            className={`absolute inset-0 w-full h-full transition-transform duration-300 ${
              index === currentIndex 
                ? "transform translate-y-0 opacity-100" 
                : index < currentIndex 
                ? "transform -translate-y-full opacity-0" 
                : "transform translate-y-full opacity-0"
            }`}
          >
            <ReelCard
              ref={(el) => {
                reelRefs.current[index] = el;
              }}
              key={`${reel?._id ?? `reel-fallback-${index}`}-${index}`}
              reel={reel}
              onReaction={handleReaction}
              isFullscreen={true}
            />
          </div>
        ))}
      </div>

      {/* Navigation Indicators */}
      {/* <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-20 flex flex-col space-y-2">
        {reels.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-8 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? "bg-white opacity-100"
                : "bg-white opacity-40 hover:opacity-70"
            }`}
          />
        ))}
      </div> */}

      {/* Create Reel Modal */}
      <CreateReelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default ReelsPage;