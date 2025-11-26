"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import ReelCard, { ReelCardRef } from "@/components/reels/ReelCard";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useGetReels, useReactReel } from "@/hooks/useReels";
import { debounce } from "lodash";

const SingleReelPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params || {};
  const {
    reels,
    pagination,
    isLoading: reelsLoading,
  } = useSelector((state: RootState) => state.reels);
  const [currentIndex, setCurrentIndex] = useState(-1); 
  const { trigger } = useGetReels(pagination.reels?.currentPage || 1);
  const { mutate: reactToReel } = useReactReel(
    reels[currentIndex >= 0 ? currentIndex : 0]?._id || ""
  );
  const reelRefs = useRef<(ReelCardRef | null)[]>([]);
  

  useEffect(() => {
    if (reels.length === 0 && !reelsLoading) {
      trigger();
    }
    const initialIndex = reels.findIndex((reel) => reel._id === id);
    if (initialIndex !== -1 && currentIndex === -1) {
      setCurrentIndex(initialIndex); 
    } else if (reels.length > 0 && currentIndex === -1) {
      setCurrentIndex(0); 
    }
  }, [id, reels, reelsLoading, trigger, currentIndex]);

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
          router.push(`/reels/${reels[currentIndex]._id}`);
        } else if (deltaY < 0 && currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          router.push(`/reels/${reels[currentIndex]._id}`);
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
        router.push(`/reels/${reels[currentIndex]._id}`);
      } else if (e.key === "ArrowDown" && currentIndex < reels.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        router.push(`/reels/${reels[currentIndex]._id}`);
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
        router.push(`/reels/${reels[currentIndex]._id}`);
      } else if (e.deltaY > 0 && currentIndex < reels.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        router.push(`/reels/${reels[currentIndex]._id}`);
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
      if (index === currentIndex && currentIndex !== -1) {
        reelRef.play();
      } else {
        reelRef.pause();
      }
    }
  });
}, [currentIndex]);

  const handleReaction = (reelId: string, emoji: string, name: string) => {
    reactToReel({ emoji, name });
  };

  const currentReel = currentIndex !== -1 ? reels[currentIndex] : undefined;

  if (reelsLoading && !currentReel) {
    return (
      <div className="min-h-screen bg-black dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading reels...</p>
        </div>
      </div>
    );
  }

  if (!currentReel) {
    return (
      <div className="min-h-screen bg-black dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <p className="text-white mb-4">Reel not found</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black dark:bg-gray-950 transition-colors duration-200">
      <div className="fixed top-0 left-0 w-full z-10 bg-black dark:bg-black/80 bg-opacity-50 dark:bg-opacity-60 p-4 flex justify-between items-center transition-colors">
        <Link href="/" className="text-white hover:text-gray-300">
          <XMarkIcon className="h-8 w-8" />
        </Link>
        <span className="text-white text-sm">
          {currentIndex + 1} / {reels.length}
        </span>
      </div>
      <div className="flex justify-center">
        {reels.map((reel, index) => (
          <div
            key={reel._id}
            className={`w-full max-w-4xl mx-auto ${
              index === currentIndex ? "block" : "hidden"
            }`}
            style={{ height: "100vh" }}
          >
            <ReelCard
              reel={reel}
              onReaction={handleReaction}
              isFullscreen={true}
              ref={(el) => {
                reelRefs.current[index] = el;
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SingleReelPage;
