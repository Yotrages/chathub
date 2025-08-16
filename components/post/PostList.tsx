'use client';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { PostItem } from './PostItem';
import { useInView } from 'react-intersection-observer';
import { useEffect, useCallback } from 'react';
import { useGetPosts } from '@/hooks/usePosts';
import { debounce } from 'lodash';

interface PostListProps {
  initialLoading?: boolean;
}

export const PostList = ({ initialLoading = false }: PostListProps) => {
  const { posts, pagination, isLoading: postsLoading } = useSelector((state: RootState) => state.post);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });
  const { trigger } = useGetPosts(pagination.posts?.currentPage || 1);

  const hasMore = pagination.posts?.hasNextPage ?? false;

  // Debounce the trigger function
  const debouncedTrigger = useCallback(
    debounce(() => {
      if (!postsLoading && hasMore) {
        trigger();
      }
    }, 500),
    [trigger, postsLoading, hasMore]
  );

  useEffect(() => {
    if (inView && hasMore && !postsLoading) {
      debouncedTrigger();
    }
    return () => debouncedTrigger.cancel(); // Cleanup debounce on unmount
  }, [inView, hasMore, postsLoading, debouncedTrigger]);

  // Initial loading state
  if ((initialLoading || postsLoading) && posts.length === 0) {
    return (
      <div className="space-y-4 px-4 sm:px-0">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow p-4 animate-pulse"
            role="status"
            aria-label="Loading posts"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
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

  // // Error state
  // if (error) {
  //   return (
  //     <div className="bg-white rounded-lg shadow p-8 text-center">
  //       <p className="text-red-500" role="alert">
  //         Failed to load posts
  //       </p>
  //       <button
  //         onClick={() => trigger()}
  //         className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
  //         aria-label="Retry loading posts"
  //       >
  //         Retry
  //       </button>
  //     </div>
  //   );
  // }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No posts yet. Be the first to post something!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostItem key={post._id} post={post} />
      ))}
      {hasMore && (
        <div
          ref={ref}
          className="text-center py-4"
          role="region"
          aria-live="polite"
        >
          {postsLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div
                className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              ></div>
              <span className="text-gray-500">Loading more posts...</span>
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
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-gray-400 py-4">
          No more posts to load
        </p>
      )}
    </div>
  );
};