// components/posts/PostList.tsx
'use client';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { PostItem } from './PostItem';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { useGetPosts } from '@/hooks/usePosts';

interface PostListProps {
  isLoading?: boolean;
}

export const PostList = ({ isLoading }: PostListProps) => {
  // Fixed: Changed from 'post' to 'posts' and accessing the correct properties
  const { posts, pagination, isLoading: postsLoading } = useSelector((state: RootState) => state.post);
  const [ref, inView] = useInView();
  const { trigger } = useGetPosts();

  // Determine if there are more posts to load
  const hasMore = pagination?.hasNextPage ?? false;

  // Infinite loading
  useEffect(() => {
    if (inView && hasMore && !postsLoading) {
      trigger();
    }
  }, [inView, hasMore, postsLoading, trigger]);

  // Show loading skeleton when initially loading
  if ((isLoading || postsLoading) && posts.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
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

  // Show empty state when no posts
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
        // Fixed: Remove the nested .post access since posts array contains Post objects directly
        <PostItem key={post._id} post={post} />
      ))}
      
      {/* Show loading indicator when fetching more posts */}
      {hasMore && (
        <div ref={ref} className="text-center py-4">
          {postsLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-500">Loading more posts...</span>
            </div>
          ) : (
            <span className="text-gray-400">Load more</span>
          )}
        </div>
      )}
    </div>
  );
};