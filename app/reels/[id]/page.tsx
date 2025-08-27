"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import ReelCard from "@/components/reels/ReelCard";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useGetReels, useReactReel } from "@/hooks/useReels";
import { debounce } from "lodash";

const ReelsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params || {};
  const {
    reels,
    pagination,
    isLoading: reelsLoading,
  } = useSelector((state: RootState) => state.reels);
  const [currentIndex, setCurrentIndex] = useState(-1); // Start with -1 to indicate not set
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const { trigger } = useGetReels(pagination.reels?.currentPage || 1);
  const { mutate: reactToReel } = useReactReel(
    reels[currentIndex >= 0 ? currentIndex : 0]?._id || ""
  );

  useEffect(() => {
    if (reels.length === 0 && !reelsLoading) {
      trigger(); // Fetch reels, prioritizing the id if provided
    }
    const initialIndex = reels.findIndex((reel) => reel._id === id);
    if (initialIndex !== -1 && currentIndex === -1) {
      setCurrentIndex(initialIndex); // Set to the id-matched reel if found
    } else if (reels.length > 0 && currentIndex === -1) {
      setCurrentIndex(0); // Default to first reel if id not found
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
    }, 200); // 200ms debounce

    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      document.removeEventListener("wheel", handleWheel);
      handleWheel.cancel(); // Cancel debounce on cleanup
    };
  }, [currentIndex, reels.length]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video && index === currentIndex && currentIndex !== -1) {
        video.play().catch(() => {});
      } else if (video) {
        video.pause();
      }
    });
  }, [currentIndex]);

  const handleReaction = (reelId: string, emoji: string, name: string) => {
    reactToReel({ emoji, name });
  };

  const currentReel = currentIndex !== -1 ? reels[currentIndex] : undefined;

  if (reelsLoading && !currentReel) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading reels...</p>
        </div>
      </div>
    );
  }

  if (!currentReel) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
    <div className="min-h-screen bg-black">
      <div className="fixed top-0 left-0 w-full z-10 bg-black bg-opacity-50 p-4 flex justify-between items-center">
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
                if (el) videoRefs.current[index] = el.querySelector("video");
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReelsPage;
