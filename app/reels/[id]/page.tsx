"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import ReelCard from "@/components/reels/ReelCard";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useGetReels, useReactReel } from "@/hooks/useReels";

const ReelsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params || {};
  const { reels, pagination, isLoading: reelsLoading } = useSelector((state: RootState) => state.reels);
  const [currentIndex, setCurrentIndex] = useState(-1); // Start with -1 to indicate not set
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const { trigger } = useGetReels(pagination.reels?.currentPage || 1); 
  const { mutate: reactToReel } = useReactReel(reels[currentIndex >= 0 ? currentIndex : 0]?._id || "");

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
    const handleSwipe = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaY = touch.clientY - (e.target as HTMLElement).getBoundingClientRect().top;
      if (deltaY > 100 && currentIndex > 0) {
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        router.push(`/reels/${reels[newIndex]._id}`);
      } else if (deltaY < -100 && currentIndex < reels.length - 1) {
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
        router.push(`/reels/${reels[newIndex]._id}`);
      }
    };

    document.addEventListener("touchmove", handleSwipe);
    return () => document.removeEventListener("touchmove", handleSwipe);
  }, [currentIndex, reels, router]);

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
        <span className="text-white text-sm">{currentIndex + 1} / {reels.length}</span>
      </div>
      <div className="flex justify-center">
        {reels.map((reel, index) => (
          <div
            key={reel._id}
            className={`w-full max-w-4xl mx-auto ${index === currentIndex ? "block" : "hidden"}`}
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