"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import { useGetUserReels } from "@/hooks/useReels";
import Link from "next/link";
import ReelCard from "@/components/reels/ReelCard";
import { useInView } from "react-intersection-observer";

interface UserReelsComponentProps {
  activeTab: string;
  userId: string;
}

const UserReelsComponent: React.FC<UserReelsComponentProps> = ({
  userId,
}) => {
  const {
    userReels,
    pagination,
    isLoading: reelsLoading,
  } = useSelector((state: RootState) => state.reels);
  const { trigger } = useGetUserReels(pagination.userReels?.currentPage || 1, userId);
  const { ref } = useInView({
    threshold: 0.3,
    triggerOnce: false,
  });
  const hasMore = pagination.userReels?.hasNextPage ?? false;

  useEffect(() => {
    if (!reelsLoading && pagination.userReels?.hasNextPage) {
      trigger();
    }
  }, [reelsLoading, pagination.userReels?.hasNextPage, trigger]);

  if (reelsLoading && userReels.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-lg shadow p-4 animate-pulse h-48"
          ></div>
        ))}
      </div>
    );
  }

  if (userReels.length === 0) {
    return <p className="text-center text-gray-500">No reels available.</p>;
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {userReels.map((reel) => (
        <Link href={`/reels/${reel._id}`} key={reel._id}>
          <ReelCard reel={reel} />
        </Link>
      ))}
      {hasMore && (
        <div
          ref={ref}
          className="text-center py-4"
          role="region"
          aria-live="polite"
        >
          {reelsLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div
                className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              ></div>
              <span className="text-gray-500">Loading more reels...</span>
            </div>
          ) : (
            <button
              onClick={() => trigger()}
              className="text-gray-400 hover:text-blue-500 transition"
              aria-label="Load more posts"
            >
              Load more
            </button>
          )}
        </div>
      )}
      {!hasMore && userReels.length > 0 && (
        <p className="text-center text-gray-400 py-4">No more reels to load</p>
      )}
    </div>
  );
};

export default UserReelsComponent;
