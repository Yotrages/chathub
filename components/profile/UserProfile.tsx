import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/libs/redux/store";
import { PostItem } from "../post/PostItem";
import { useInView } from "react-intersection-observer";
import { useEffect, useMemo, useRef } from "react";
import { useGetUserPosts, useGetLikedPosts, useGetSavedPosts } from "@/hooks/usePosts";
import { resetUserPosts, resetLikedPosts, resetSavedPosts } from "@/libs/redux/postSlice";
import { selectPagination } from "@/libs/redux/postSlice";
import { Bookmark } from "lucide-react";
import { formatRelativeTime } from "@/utils/formatter";

interface PostListProps {
  isLoading?: boolean;
  type?: "posts" | "likes" | "saved";
  userId: string;
  username?: string;
  sortType?: string; 
}


export const UserPosts = ({ isLoading, type = "posts", userId, sortType = "latest", username }: PostListProps) => {
  const dispatch: AppDispatch = useDispatch();
  const { userPosts, likedPosts, savedPosts, isLoading: postsLoading } = useSelector(
    (state: RootState) => state.post
  );
  const pagination = useSelector(
    selectPagination(type === "posts" ? "userPosts" : type === "likes" ? "likedPosts" : "savedPosts")
  );

  const { trigger: triggerUserPosts } = useGetUserPosts(1, userId);
  const { trigger: triggerLikedPosts } = useGetLikedPosts(1, userId);
  const { trigger: triggerSavedPosts } = useGetSavedPosts(1, userId, sortType); 

  const prevTypeRef = useRef(type);
  const prevUserIdRef = useRef(userId);
  const prevSortTypeRef = useRef(sortType);

  const posts = useMemo(() => {
    switch (type) {
      case "likes":
        return likedPosts;
      case "saved":
        return savedPosts;
      default:
        return userPosts;
    }
  }, [type, userPosts, likedPosts, savedPosts]);

  const [ref, inView] = useInView();
  const hasMore = pagination?.hasNextPage ?? false;

  useEffect(() => {
    if (
      prevTypeRef.current !== type ||
      prevUserIdRef.current !== userId ||
      prevSortTypeRef.current !== sortType
    ) {
      switch (type) {
        case "likes":
          dispatch(resetLikedPosts());
          triggerLikedPosts();
          break;
        case "saved":
          dispatch(resetSavedPosts());
          triggerSavedPosts();
          break;
        default:
          dispatch(resetUserPosts());
          triggerUserPosts();
          break;
      }

      prevTypeRef.current = type;
      prevUserIdRef.current = userId;
      prevSortTypeRef.current = sortType;
    }
  }, [type, userId, sortType, dispatch, triggerUserPosts, triggerLikedPosts, triggerSavedPosts]);

  useEffect(() => {
    if (inView && hasMore && !postsLoading) {
      switch (type) {
        case "likes":
          triggerLikedPosts();
          break;
        case "saved":
          triggerSavedPosts();
          break;
        default:
          triggerUserPosts();
          break;
      }
    }
  }, [inView, hasMore, postsLoading, type, triggerUserPosts, triggerLikedPosts, triggerSavedPosts]);

  if ((isLoading || postsLoading) && posts.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-lg p-4 animate-pulse transition-colors duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (posts?.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-lg p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          {type === "likes"
            ? "No liked posts yet"
            : type === "saved"
            ? "No saved posts yet"
            : `No posts yet from ${username}`}
        </p>
      </div>
    );
  }

  const handleLoadMore = () => {
    switch (type) {
      case "likes":
        triggerLikedPosts();
        break;
      case "saved":
        triggerSavedPosts();
        break;
      default:
        triggerUserPosts();
        break;
    }
  };

  return (
    <div className="space-y-4">
      {posts?.map((post) => (
        <div key={post._id} className="relative">
          {type === "saved" && post.savedAt && (
            <div className="flex items-center justify-between mb-2 px-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Bookmark className="w-4 h-4 text-blue-500" />
                <span>Saved {formatRelativeTime(post.savedAt)}</span>
              </div>
            </div>
          )}
          <PostItem post={post} />
        </div>
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
              onClick={handleLoadMore}
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