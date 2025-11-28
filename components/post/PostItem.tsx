"use client";
import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/libs/redux/store";
import { Post } from "@/types";
import PostHeader from "./PostHeader";
import PostContent from "./PostContent";
import PostMediaGallery from "./PostMediaGallery";
import PostEngagement from "./PostEngagement";
import PostComments from "./PostComments";
import EditModal from "./Editmodal";
import { ReactionsModal } from "./LikesModal";
import { PostModal } from "./PostModal";
import { removePost, selectComments } from "@/libs/redux/postSlice";
import { useRouter } from "next/navigation";

interface PostItemProps {
  post: Post;
  isModal?: boolean;
}

export const PostItem = ({ post, isModal = false }: PostItemProps) => {
  const [showComments, setShowComments] = useState(isModal);
  const [showPostModal, setShowPostModal] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [showReactions, setShowReactions] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [hide, setHide] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasSuccessfullyFetched, setHasSuccessfullyFetched] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch: AppDispatch = useDispatch();
  const router = useRouter();
  const comments = useSelector(selectComments(post._id));
  // const { trigger: fetchComments, isLoading: isFetchingComments } =
  //   useGetComments(
  //     post._id,
  //     () => {
  //       setHasSuccessfullyFetched(true);
  //     },
  //     () => {
  //       setFetchAttempted(false);
  //     }
  //   );

  useEffect(() => {
    const handleOnline = () => {
      console.log("Connection restored");
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log("Connection lost");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // useEffect(() => {
  //   if (!isOnline) {
  //     console.log(
  //       `User is offline, skipping comment fetch for postId ${post._id}`
  //     );
  //     return;
  //   }

  //   if (hasSuccessfullyFetched) {
  //     console.log(
  //       `Comments already successfully fetched for postId ${post._id}, skipping`
  //     );
  //     return;
  //   }

  //   if (fetchAttempted) {
  //     console.log(
  //       `Fetch already attempted for postId ${post._id}, waiting for result`
  //     );
  //     return;
  //   }

  //   if (comments && comments.length > 0) {
  //     console.log(
  //       `Comments already exist in store for postId ${post._id}, marking as successfully fetched`
  //     );
  //     setHasSuccessfullyFetched(true);
  //     return;
  //   }

  //   console.log(`Fetching comments for postId ${post._id}`);
  //   setFetchAttempted(true);

  //   fetchComments();
  // }, [
  //   post._id,
  //   isOnline,
  //   hasSuccessfullyFetched,
  //   fetchAttempted,
  //   comments,
  //   fetchComments,
  // ]);

  useEffect(() => {
    if (isOnline && !hasSuccessfullyFetched && !fetchAttempted) {
      console.log(
        `User came back online, attempting to fetch comments for postId ${post._id}`
      );
      setFetchAttempted(false);
    }
  }, [isOnline, hasSuccessfullyFetched, fetchAttempted, post._id]);

  useEffect(() => {
    console.log(`Comments updated for postId ${post._id}:`, comments);

    if (comments && comments.length > 0 && !hasSuccessfullyFetched) {
      setHasSuccessfullyFetched(true);
    }
  }, [comments, post._id, hasSuccessfullyFetched]);

  const toggleComments = () => {
    const isOnPostPage = window.location.href.includes(`/post/${post._id}`);

    if (window.innerWidth <= 768 && !isOnPostPage && !isModal) {
      console.log(`Redirecting to /post/${post._id} for mobile view`);
      router.push(`/post/${post._id}`);
    } else if (window.innerWidth > 768 && !isOnPostPage && !isModal) {
      console.log(`Opening modal for postId ${post._id}`);
      setShowPostModal(true);
    } else {
      console.log(
        `Toggling comments for postId ${
          post._id
        }, showComments: ${!showComments}`
      );
      setShowComments(!showComments);
    }
  };

  const hidePost = () => {
    console.log(`Hiding post ${post._id}`);
    setHide(true);
    dispatch(removePost(post._id));
  };

  const handleEdit = () => {
    if (window.innerWidth <= 600) {
          router.push(`/post/${post._id}/edit`)
        } else {
          setIsOpen(true)
        }
  }

  // const retryFetchComments = () => {
  //   if (!isOnline) {
  //     console.log("Cannot retry - user is offline");
  //     return;
  //   }

  //   console.log(`Manually retrying comment fetch for postId ${post._id}`);
  //   setFetchAttempted(false);
  //   setHasSuccessfullyFetched(false);
  // };

  if (hide) return null;

  return (
    <>
      <article className="bg-white dark:bg-gray-800 rounded-2xl flex flex-col shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-md dark:hover:shadow-xl transition-shadow duration-200">
        <PostHeader
          authorId={post.authorId}
          createdAt={post.createdAt}
          postId={post._id}
          content={post.content}
          onEdit={handleEdit}
          onHide={hidePost}
        />
        <PostContent content={post.content} />
        <PostMediaGallery
          images={post.images || []}
          currentMediaIndex={currentMediaIndex}
          setCurrentMediaIndex={setCurrentMediaIndex}
          isVideoPlaying={isVideoPlaying}
          setIsVideoPlaying={setIsVideoPlaying}
          isVideoMuted={isVideoMuted}
          setIsVideoMuted={setIsVideoMuted}
          videoRef={videoRef}
        />
        <PostEngagement
          postId={post._id}
          reactions={post.reactions || []}
          comments={comments || []}
          images={post.images || []}
          user={user}
          showReactions={showReactions}
          setShowReactions={setShowReactions}
          onShowComments={toggleComments}
          showComments={showComments}
          setShowLikes={setShowLikes}
          post={post}
        />

        {showComments && (
          <div className="w-full max-w-full h-[400px] sm:h-[500px] border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            {/* {isFetchingComments ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p>Loading comments...</p>
              </div>
            ) : !hasSuccessfullyFetched && fetchAttempted ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p>Failed to load comments.</p>
                <button
                  onClick={retryFetchComments}
                  className="mt-2 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white dark:text-gray-100 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : ( */}
              <PostComments
                type="post"
                dynamicId={post._id}
                comments={comments}
                user={user}
                postAuthorId={post.authorId._id}
                commentContent={commentContent}
                setCommentContent={setCommentContent}
              />
            {/* )} */}
          </div>
        )}
        {isOpen && (
          <EditModal onClose={() => setIsOpen(false)} postId={post._id} />
        )}
        {showLikes && (
          <ReactionsModal
            reactions={post.reactions}
            isOpen={showLikes}
            onClose={() => setShowLikes(false)}
            type="Post"
          />
        )}
      </article>

      {/* Desktop Modal */}
      {showPostModal && (
        <PostModal
          isModalOpen={showPostModal}
          onModalClose={() => setShowPostModal(false)}
          post={post}
        />
      )}
    </>
  );
};
