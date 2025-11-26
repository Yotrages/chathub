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

const UserReelsComponent: React.FC<UserReelsComponentProps> = ({ userId }) => {
  const {
    userReels,
    pagination,
    isLoading: reelsLoading,
  } = useSelector((state: RootState) => state.reels);
  const { user } = useSelector((state: RootState) => state.auth);
  const { trigger } = useGetUserReels(
    pagination.userReels?.currentPage || 1,
    userId
  );
  const { ref } = useInView({
    threshold: 0.3,
    triggerOnce: false,
  });
  const hasMore = pagination.userReels?.hasNextPage ?? false;

  useEffect(() => {
    if (!reelsLoading && pagination.userReels?.hasNextPage) {
      trigger();
    }
  }, [reelsLoading, pagination.userReels?.hasNextPage]);

  if (reelsLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-lg p-4 animate-pulse transition-colors duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/6"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (userReels?.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-lg p-8 text-center transition-colors duration-200">
        <p className="text-gray-500 dark:text-gray-400">{`No reels yet from ${user?.username}`}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center flex-col space-y-4">
      <div className="flex flex-wrap gap-3">
        {userReels?.map((reel) => (
          <Link href={`/reels/${reel._id}`} key={reel._id}>
            <ReelCard reel={reel} isCompact={true} />
          </Link>
        ))}
      </div>
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
      {!hasMore && userReels?.length > 0 && (
        <p className="text-center text-gray-400 py-4">No more reels to load</p>
      )}
    </div>
  );
};

export default UserReelsComponent;
