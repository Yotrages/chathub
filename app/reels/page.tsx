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
    const handleSwipe = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaY =
        touch.clientY - (e.target as HTMLElement).getBoundingClientRect().top;
      if (deltaY > 100 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1); // Swipe up for previous
      } else if (deltaY < -100 && currentIndex < reels.length - 1) {
        setCurrentIndex((prev) => prev + 1); // Swipe down for next
      }
    };

    document.addEventListener("touchmove", handleSwipe);
    return () => document.removeEventListener("touchmove", handleSwipe);
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
