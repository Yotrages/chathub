'use client';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/libs/redux/store';
import { PostItem } from '../post/PostItem';
import { useInView } from 'react-intersection-observer';
import { useEffect, useMemo } from 'react';
import { useGetUserPosts, useGetLikedPosts, useGetSavedPosts } from '@/hooks/usePosts';
import { resetUserPosts, resetLikedPosts, resetSavedPosts } from '@/libs/redux/postSlice';
import { selectPagination } from '@/libs/redux/postSlice';

interface PostListProps {
  isLoading?: boolean;
  type?: 'posts' | 'likes' | 'saved';
  userId: string;
}

export const UserPosts = ({ isLoading, type = 'posts', userId }: PostListProps) => {
  const dispatch: AppDispatch = useDispatch();
  const { userPosts, likedPosts, savedPosts, isLoading: postsLoading } = useSelector(
    (state: RootState) => state.post
  );
  const pagination = useSelector(selectPagination(type === 'posts' ? 'userPosts' : type === 'likes' ? 'likedPosts' : 'savedPosts'));

  const { user } = useSelector((state: RootState) => state.auth);

  // Map post type to posts, trigger, and reset action
  const postConfig = useMemo(
    () => ({
      posts: {
        posts: userPosts,
        trigger: useGetUserPosts,
        resetAction: resetUserPosts,
      },
      likes: {
        posts: likedPosts,
        trigger: useGetLikedPosts,
        resetAction: resetLikedPosts,
      },
      saved: {
        posts: savedPosts,
        trigger: useGetSavedPosts,
        resetAction: resetSavedPosts,
      },
    }),
    [userPosts, likedPosts, savedPosts]
  );

  const { posts, trigger: triggerHook } = postConfig[type];
  const { trigger } = triggerHook( 1, userId);
  const [ref, inView] = useInView();
  const hasMore = pagination?.hasNextPage ?? false;

  // Reset posts and pagination when type or userId changes
  useEffect(() => {
    dispatch(postConfig[type].resetAction());
    trigger(); // Load initial page
  }, [type, userId, dispatch, trigger, postConfig]);

  // Infinite scroll
  useEffect(() => {
    if (inView && hasMore && !postsLoading) {
      trigger();
    }
  }, [inView, hasMore, postsLoading, trigger]);

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

  if (posts?.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">
          {type === 'likes'
            ? 'No liked posts yet'
            : type === 'saved'
            ? 'No saved posts yet'
            : `No posts yet from ${user?.username || user?.name}`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts?.map((post) => (
        <PostItem key={post._id} post={post} />
      ))}
      {hasMore && (
        <div ref={ref} className="text-center py-4" role="region" aria-live="polite">
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
        <p className="text-center text-gray-400 py-4">No more posts to load</p>
      )}
    </div>
  );
};